-- ============================================================================
-- Moderación UGC: bloqueo de usuarios + denuncias de contenido
-- (compliance con la política de User Generated Content de Google Play)
--
-- Piezas:
--   1. user_blocks — quién bloquea a quién. Bloquear rompe la alianza en ambas
--      direcciones, y con ella se cierran solos el chat nuevo (send_message
--      re-valida are_allies), los posts (RLS are_allies) y el feed (circle de
--      friendships accepted). El historial de chat se conserva (solo lectura).
--   2. Gate anti re-solicitud: send_friend_request y la policy de INSERT de
--      friendships rechazan cualquier par bloqueado (la policy cubre el insert
--      directo desde el cliente, que la RLS original permite).
--   3. content_reports + report_content() — denuncias de mensajes, posts o
--      perfiles, con rate-limit anti-abuso y aviso push opcional al admin
--      (vault secret 'moderation_admin_user_id'; si no existe, silencio).
--
-- Moderación: revisión manual de content_reports (service role) y borrado del
-- contenido con los RPCs/SQL existentes. Sin borrado por moderador in-app aún.
-- ============================================================================

-- ── 1. Tabla de bloqueos ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_blocks_select_own ON public.user_blocks;
CREATE POLICY user_blocks_select_own
  ON public.user_blocks FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id);
-- Escrituras solo por RPC (sin policies de INSERT/UPDATE/DELETE).

CREATE OR REPLACE FUNCTION public.is_blocked_between(p_a UUID, p_b UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = p_a AND blocked_id = p_b)
       OR (blocker_id = p_b AND blocked_id = p_a)
  );
$$;

-- ── 2. Bloquear / desbloquear / listar ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.block_user(p_blocked_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_blocked_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_block_self';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_blocked_id) THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  INSERT INTO user_blocks (blocker_id, blocked_id)
  VALUES (auth.uid(), p_blocked_id)
  ON CONFLICT DO NOTHING;

  -- Romper la alianza (y cualquier solicitud pendiente) en ambas direcciones.
  DELETE FROM friendships
  WHERE (user_id = auth.uid() AND friend_id = p_blocked_id)
     OR (user_id = p_blocked_id AND friend_id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.unblock_user(p_blocked_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  DELETE FROM user_blocks
  WHERE blocker_id = auth.uid() AND blocked_id = p_blocked_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_blocked_users()
RETURNS TABLE (
  blocked_id UUID,
  username TEXT,
  avatar_url TEXT,
  blocked_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.blocked_id, p.username, p.avatar_url, b.created_at
  FROM user_blocks b
  JOIN profiles p ON p.id = b.blocked_id
  WHERE b.blocker_id = auth.uid()
  ORDER BY b.created_at DESC;
$$;

-- ── 3. Gate anti re-solicitud ───────────────────────────────────────────────

-- La policy original permite INSERT directo desde el cliente; se endurece
-- para que un par bloqueado no pueda crear filas saltándose el RPC.
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND NOT public.is_blocked_between(user_id, friend_id)
  );

-- Recreación de send_friend_request con el check de bloqueo (cuerpo original
-- de 20250115000002 + validación nueva).
CREATE OR REPLACE FUNCTION public.send_friend_request(p_friend_username TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_friend_id UUID;
  v_existing_friendship UUID;
  v_friendship_id UUID;
BEGIN
  SELECT id INTO v_friend_id
  FROM profiles
  WHERE username = p_friend_username;

  IF v_friend_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_friend_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot add yourself as a friend';
  END IF;

  IF public.is_blocked_between(auth.uid(), v_friend_id) THEN
    RAISE EXCEPTION 'blocked';
  END IF;

  SELECT id INTO v_existing_friendship
  FROM friendships
  WHERE (user_id = auth.uid() AND friend_id = v_friend_id)
     OR (user_id = v_friend_id AND friend_id = auth.uid());

  IF v_existing_friendship IS NOT NULL THEN
    RAISE EXCEPTION 'Friendship already exists';
  END IF;

  INSERT INTO friendships (user_id, friend_id, status)
  VALUES (auth.uid(), v_friend_id, 'pending')
  RETURNING id INTO v_friendship_id;

  RETURN v_friendship_id;
END;
$$;

-- ── 4. Denuncias de contenido ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('message', 'post', 'profile')),
  content_id TEXT,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'other')),
  details TEXT CHECK (char_length(details) <= 500),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status
  ON public.content_reports(status, created_at DESC);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_reports_select_own ON public.content_reports;
CREATE POLICY content_reports_select_own
  ON public.content_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);
-- Escrituras solo por RPC; revisión/estado solo con service role.

CREATE OR REPLACE FUNCTION public.report_content(
  p_reported_user_id UUID,
  p_content_type TEXT,
  p_content_id TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT 'other',
  p_details TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_admin TEXT;
  v_reporter_username TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_reported_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_report_self';
  END IF;
  IF p_content_type NOT IN ('message', 'post', 'profile') THEN
    RAISE EXCEPTION 'invalid_content_type';
  END IF;
  IF p_reason NOT IN ('spam', 'harassment', 'inappropriate', 'other') THEN
    RAISE EXCEPTION 'invalid_reason';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_reported_user_id) THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  -- Anti-abuso: máx 20 denuncias por 24 h por usuario.
  IF (
    SELECT count(*) FROM content_reports
    WHERE reporter_id = auth.uid()
      AND created_at > now() - INTERVAL '24 hours'
  ) >= 20 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;

  INSERT INTO content_reports
    (reporter_id, reported_user_id, content_type, content_id, reason, details)
  VALUES (
    auth.uid(),
    p_reported_user_id,
    p_content_type,
    NULLIF(p_content_id, ''),
    p_reason,
    NULLIF(left(coalesce(p_details, ''), 500), '')
  )
  RETURNING id INTO v_id;

  -- Aviso push al admin. Opcional: si el vault secret no existe, silencio.
  BEGIN
    SELECT decrypted_secret INTO v_admin
    FROM vault.decrypted_secrets
    WHERE name = 'moderation_admin_user_id'
    LIMIT 1;

    IF v_admin IS NOT NULL THEN
      SELECT username INTO v_reporter_username FROM profiles WHERE id = auth.uid();
      PERFORM fn_notify_push(
        ARRAY[v_admin::uuid],
        'content_report',
        jsonb_build_object(
          'report_id', v_id,
          'reason', p_reason,
          'content_type', p_content_type,
          'username', coalesce(v_reporter_username, '?')
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_id;
END;
$$;

-- ── Grants y comentarios ────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.is_blocked_between(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_blocked_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_content(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON TABLE public.user_blocks IS
  'Bloqueos entre usuarios (compliance UGC). Bloquear rompe la alianza y con ella el acceso social.';
COMMENT ON TABLE public.content_reports IS
  'Denuncias de contenido/usuarios. Revisión manual con service role; estado pending→reviewed/actioned/dismissed.';
COMMENT ON FUNCTION public.block_user(UUID) IS
  'Bloquea a un usuario: inserta en user_blocks y elimina friendships en ambas direcciones.';
COMMENT ON FUNCTION public.report_content(UUID, TEXT, TEXT, TEXT, TEXT) IS
  'Crea una denuncia (message|post|profile) con rate-limit 20/24h y push opcional al admin (vault moderation_admin_user_id).';
