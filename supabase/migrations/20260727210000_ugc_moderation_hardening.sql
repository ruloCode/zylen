-- ============================================================================
-- Hardening de la moderación UGC (correcciones del code review de 20260727190000)
--
--   1. is_blocked_with(p_other) anclada a auth.uid() reemplaza a
--      is_blocked_between(a, b): la versión de argumentos libres permitía a
--      cualquier sesión (incluso anon) sondear el grafo de bloqueos ajeno.
--   2. are_allies gana guard de invocador por el mismo motivo (todas las
--      policies/RPCs la llaman con auth.uid() como uno de los argumentos).
--   3. report_content valida que el contenido denunciado pertenezca al usuario
--      denunciado (anti report-brigading) y rechaza denuncias duplicadas.
--   4. block_user expira las invitaciones de arena pendientes entre ambos.
--   5. get_conversations oculta los DMs con usuarios bloqueados (el historial
--      se conserva; simplemente no se exhibe en la bandeja).
--   6. accept_friend_request gana gate de bloqueo (cierra la carrera
--      send_friend_request ∥ block_user) y search_path fijo; ídem
--      reject_friend_request y get_mutual_friends_count.
-- ============================================================================

-- ── 1. Helper anclado al invocador ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_blocked_with(p_other UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = auth.uid() AND blocked_id = p_other)
       OR (blocker_id = p_other AND blocked_id = auth.uid())
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_blocked_with(UUID) TO authenticated;

-- La policy y el RPC pasan a usar la versión anclada; después se elimina la
-- función filtrante.
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND NOT public.is_blocked_with(friend_id)
  );

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

  IF public.is_blocked_with(v_friend_id) THEN
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

DROP FUNCTION IF EXISTS public.is_blocked_between(UUID, UUID);

-- ── 2. are_allies con guard de invocador ────────────────────────────────────
-- Todas las policies y RPCs la invocan con auth.uid() como uno de los dos
-- argumentos; para cualquier otro par devuelve false en vez de revelar la
-- relación.

CREATE OR REPLACE FUNCTION public.are_allies(p_a UUID, p_b UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (p_a = auth.uid() OR p_b = auth.uid())
    AND EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
        AND ((user_id = p_a AND friend_id = p_b) OR (user_id = p_b AND friend_id = p_a))
    );
$$;

-- ── 3. report_content: pertenencia del contenido + anti-duplicados ──────────

CREATE INDEX IF NOT EXISTS idx_content_reports_reporter
  ON public.content_reports(reporter_id, created_at DESC);

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
  v_content_uuid UUID;
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

  -- El contenido denunciado debe existir y pertenecer al usuario denunciado
  -- (anti report-brigading: sin esto se puede incriminar a un tercero).
  IF p_content_id IS NOT NULL AND p_content_id <> '' THEN
    BEGIN
      v_content_uuid := p_content_id::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'invalid_content_id';
    END;

    IF p_content_type = 'message' THEN
      IF NOT EXISTS (
        SELECT 1 FROM messages
        WHERE id = v_content_uuid AND sender_id = p_reported_user_id
      ) THEN
        RAISE EXCEPTION 'content_mismatch';
      END IF;
    ELSIF p_content_type = 'post' THEN
      IF NOT EXISTS (
        SELECT 1 FROM progress_posts
        WHERE id = v_content_uuid AND user_id = p_reported_user_id
      ) THEN
        RAISE EXCEPTION 'content_mismatch';
      END IF;
    END IF;

    -- Una denuncia por contenido y denunciante.
    IF EXISTS (
      SELECT 1 FROM content_reports
      WHERE reporter_id = auth.uid()
        AND content_type = p_content_type
        AND content_id = p_content_id
    ) THEN
      RAISE EXCEPTION 'already_reported';
    END IF;
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

-- ── 4. block_user: expirar invitaciones de arena pendientes ─────────────────

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

  DELETE FROM friendships
  WHERE (user_id = auth.uid() AND friend_id = p_blocked_id)
     OR (user_id = p_blocked_id AND friend_id = auth.uid());

  UPDATE arena_invites
  SET status = 'expired', responded_at = now()
  WHERE status = 'pending'
    AND ((inviter_id = auth.uid() AND invitee_id = p_blocked_id)
      OR (inviter_id = p_blocked_id AND invitee_id = auth.uid()));
END;
$$;

-- ── 5. get_conversations: ocultar DMs con bloqueados ────────────────────────

CREATE OR REPLACE FUNCTION public.get_conversations()
RETURNS TABLE (
  conversation_id      UUID,
  kind                 TEXT,
  other_user_id        UUID,
  other_username       VARCHAR,
  other_avatar_url     TEXT,
  other_last_active_at TIMESTAMPTZ,
  last_message_kind    TEXT,
  last_message_body    TEXT,
  last_message_sender_id UUID,
  last_message_at      TIMESTAMPTZ,
  unread_count         INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.kind,
    o.user_id,
    p.username,
    p.avatar_url,
    p.last_active_at,
    lm.kind,
    lm.body,
    lm.sender_id,
    c.last_message_at,
    COALESCE((
      SELECT COUNT(*)::INT FROM messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id <> v_uid
        AND m.created_at > me.last_read_at
    ), 0)
  FROM conversations c
  INNER JOIN conversation_members me
    ON me.conversation_id = c.id AND me.user_id = v_uid
  LEFT JOIN conversation_members o
    ON o.conversation_id = c.id AND o.user_id <> v_uid
  LEFT JOIN profiles p ON p.id = o.user_id
  LEFT JOIN LATERAL (
    SELECT m.kind, m.body, m.sender_id
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON TRUE
  WHERE (c.last_message_at IS NOT NULL OR c.created_at > NOW() - INTERVAL '7 days')
    AND (o.user_id IS NULL OR NOT public.is_blocked_with(o.user_id))
  ORDER BY COALESCE(c.last_message_at, c.created_at) DESC;
END;
$$;

-- ── 6. accept/reject/mutual: gate de bloqueo + search_path fijo ─────────────

CREATE OR REPLACE FUNCTION public.accept_friend_request(p_friendship_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_friendship RECORD;
BEGIN
  SELECT * INTO v_friendship
  FROM friendships
  WHERE id = p_friendship_id;

  IF v_friendship IS NULL THEN
    RAISE EXCEPTION 'Friendship request not found';
  END IF;

  IF v_friendship.friend_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only accept requests sent to you';
  END IF;

  IF v_friendship.status != 'pending' THEN
    RAISE EXCEPTION 'This request has already been processed';
  END IF;

  -- Cierra la carrera send_friend_request ∥ block_user: una pending que
  -- sobreviva al bloqueo no puede aceptarse.
  IF public.is_blocked_with(v_friendship.user_id) THEN
    RAISE EXCEPTION 'blocked';
  END IF;

  UPDATE friendships
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_friendship_id;

  INSERT INTO friendships (user_id, friend_id, status)
  VALUES (auth.uid(), v_friendship.user_id, 'accepted')
  ON CONFLICT (user_id, friend_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_friend_request(p_friendship_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_friendship RECORD;
BEGIN
  SELECT * INTO v_friendship
  FROM friendships
  WHERE id = p_friendship_id;

  IF v_friendship IS NULL THEN
    RAISE EXCEPTION 'Friendship request not found';
  END IF;

  IF v_friendship.friend_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only reject requests sent to you';
  END IF;

  DELETE FROM friendships WHERE id = p_friendship_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_mutual_friends_count(p_user_id UUID, p_friend_id UUID)
RETURNS INT
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(DISTINCT f1.friend_id)::INT
  FROM friendships f1
  INNER JOIN friendships f2 ON f1.friend_id = f2.friend_id
  WHERE f1.user_id = p_user_id
    AND f2.user_id = p_friend_id
    AND f1.status = 'accepted'
    AND f2.status = 'accepted';
$$;

-- ── Grants ──────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.send_friend_request(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_content(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_friend_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_friend_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mutual_friends_count(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.is_blocked_with(UUID) IS
  'True si existe bloqueo entre el invocador (auth.uid()) y p_other, en cualquier dirección.';
