-- ============================================================================
-- Chat de aliados (1:1) + fotos de progreso con reacciones
--
-- Piezas:
--   1. Helpers: are_allies / is_conversation_member / can_access_progress_photo
--      (SECURITY DEFINER para poder usarse desde policies sin recursión RLS).
--   2. Chat: conversations + conversation_members + messages. Un DM es una
--      conversación kind='dm' con dm_key único por par; el modelo ya soporta
--      grupos por misión (kind='mission') sin migración destructiva.
--   3. Fotos de progreso: progress_posts (entidad durable, borrable por su
--      autor) + post_reactions (una por usuario, toggle). El feed sigue siendo
--      UN stream: cada post emite un activity_event 'progress_photo' que
--      cascade-borra con el post (mismo patrón que completion_id).
--   4. Storage: bucket PRIVADO progress-photos (las fotos de proceso son
--      sensibles — solo aliados las leen, vía signed URLs).
--   5. get_friend_activity recreada con columnas finales aditivas
--      (post_id, image_path, reactions) — clientes viejos siguen funcionando.
--   6. Push: triggers de mensaje nuevo y reacción vía fn_notify_push
--      (20260724120000); fn_push_on_arena_invite recreado para incluir
--      inviter_id (la Edge Function arma la sala del invitador con él).
--   7. Realtime: messages entra a la publicación supabase_realtime (el cliente
--      se suscribe con postgres_changes SOLO a la conversación abierta; la
--      RLS de SELECT autoriza qué filas ve cada socket).
--
-- Idempotente (IF NOT EXISTS / DROP POLICY IF EXISTS / ON CONFLICT) para
-- poder aplicarse al proyecto live con seguridad. Escrituras SOLO vía RPCs
-- SECURITY DEFINER — sin policies de INSERT/UPDATE/DELETE en las tablas.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helpers
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.are_allies(p_a UUID, p_b UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
      AND ((user_id = p_a AND friend_id = p_b) OR (user_id = p_b AND friend_id = p_a))
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Chat: conversations / conversation_members / messages
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            TEXT NOT NULL DEFAULT 'dm' CHECK (kind IN ('dm', 'mission')),
  -- fase 2: chat grupal por misión compartida
  mission_id      UUID REFERENCES public.shared_missions(id) ON DELETE CASCADE,
  -- 'menor_uid:mayor_uid' — garantiza UNA conversación por par de aliados
  dm_key          TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_conv_members_user
  ON public.conversation_members (user_id);

-- La BD live arrastra una tabla public.messages LEGACY (persistencia del
-- chat AI v1: id, user_id, role, content) vacía y sin referencias en el
-- código (verificado 2026-07-24: 0 filas, ningún .from('messages')). Se
-- retira para darle el nombre al chat de aliados. Guard: solo si tiene la
-- forma legacy (columna role, sin conversation_id) — nunca toca la nueva.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages'
      AND column_name = 'role'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages'
      AND column_name = 'conversation_id'
  ) THEN
    DROP TABLE public.messages;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'image')),
  body            TEXT NOT NULL DEFAULT '' CHECK (char_length(body) <= 2000),
  -- path dentro del bucket progress-photos ('chat/{conversation_id}/…'), NO URL
  image_path      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT image_has_path CHECK (kind <> 'image' OR image_path IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created
  ON public.messages (conversation_id, created_at DESC);

-- Definido DESPUÉS de las tablas: los cuerpos LANGUAGE sql se validan al
-- crearse (a diferencia de plpgsql) y este referencia conversation_members.
CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  );
$$;

ALTER TABLE public.conversations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages             ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_select_member ON public.conversations;
CREATE POLICY conversations_select_member
  ON public.conversations FOR SELECT TO authenticated
  USING (public.is_conversation_member(id, auth.uid()));

DROP POLICY IF EXISTS conv_members_select_member ON public.conversation_members;
CREATE POLICY conv_members_select_member
  ON public.conversation_members FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));

-- Imprescindible: Realtime postgres_changes autoriza cada fila con esta policy.
DROP POLICY IF EXISTS messages_select_member ON public.messages;
CREATE POLICY messages_select_member
  ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));

-- Realtime: publicar messages (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- --- RPCs de chat ---

-- Abre (o encuentra) el DM con un aliado. Exige amistad aceptada.
CREATE OR REPLACE FUNCTION public.get_or_create_dm(p_friend_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_key TEXT;
  v_id  UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_friend_id = v_uid THEN
    RAISE EXCEPTION 'self_dm';
  END IF;
  IF NOT public.are_allies(v_uid, p_friend_id) THEN
    RAISE EXCEPTION 'not_allies';
  END IF;

  v_key := least(v_uid::text, p_friend_id::text) || ':' ||
           greatest(v_uid::text, p_friend_id::text);

  SELECT c.id INTO v_id FROM conversations c WHERE c.dm_key = v_key;
  IF v_id IS NULL THEN
    BEGIN
      INSERT INTO conversations (kind, dm_key) VALUES ('dm', v_key)
      RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
      -- carrera: ambos lados llamaron a la vez; el índice único resuelve
      SELECT c.id INTO v_id FROM conversations c WHERE c.dm_key = v_key;
    END;
  END IF;

  INSERT INTO conversation_members (conversation_id, user_id)
  VALUES (v_id, v_uid), (v_id, p_friend_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN v_id;
END;
$$;

-- Envía un mensaje (texto y/o imagen ya subida al bucket por el remitente).
-- Devuelve { id, created_at } para reconciliar el mensaje optimista.
CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id UUID,
  p_body TEXT,
  p_image_path TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_conv  RECORD;
  v_body  TEXT := COALESCE(trim(p_body), '');
  v_kind  TEXT;
  v_other UUID;
  v_msg   RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_conversation_member(p_conversation_id, v_uid) THEN
    RAISE EXCEPTION 'not_member';
  END IF;
  IF v_body = '' AND p_image_path IS NULL THEN
    RAISE EXCEPTION 'empty_message';
  END IF;
  IF char_length(v_body) > 2000 THEN
    RAISE EXCEPTION 'message_too_long';
  END IF;

  SELECT * INTO v_conv FROM conversations c WHERE c.id = p_conversation_id;

  -- En un DM, des-aliarse bloquea enviar (el historial se conserva).
  IF v_conv.kind = 'dm' THEN
    SELECT cm.user_id INTO v_other
    FROM conversation_members cm
    WHERE cm.conversation_id = p_conversation_id AND cm.user_id <> v_uid
    LIMIT 1;
    IF v_other IS NOT NULL AND NOT public.are_allies(v_uid, v_other) THEN
      RAISE EXCEPTION 'not_allies';
    END IF;
  END IF;

  IF p_image_path IS NOT NULL THEN
    -- La imagen debe vivir en la carpeta de esta conversación y ser del remitente
    IF position('chat/' || p_conversation_id || '/' || v_uid || '-' IN p_image_path) <> 1 THEN
      RAISE EXCEPTION 'invalid_image_path';
    END IF;
    v_kind := 'image';
  ELSE
    v_kind := 'text';
  END IF;

  INSERT INTO messages (conversation_id, sender_id, kind, body, image_path)
  VALUES (p_conversation_id, v_uid, v_kind, v_body, p_image_path)
  RETURNING id, created_at INTO v_msg;

  UPDATE conversations SET last_message_at = v_msg.created_at
  WHERE id = p_conversation_id;

  -- Lo propio ya está leído; presencia al día
  UPDATE conversation_members SET last_read_at = v_msg.created_at
  WHERE conversation_id = p_conversation_id AND user_id = v_uid;
  UPDATE profiles SET last_active_at = NOW() WHERE id = v_uid;

  RETURN jsonb_build_object('id', v_msg.id, 'created_at', v_msg.created_at);
END;
$$;

-- Lista de conversaciones del caller con el otro miembro (DM), último
-- mensaje y unread count. Ordenada por actividad.
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
  WHERE c.last_message_at IS NOT NULL OR c.created_at > NOW() - INTERVAL '7 days'
  ORDER BY COALESCE(c.last_message_at, c.created_at) DESC;
END;
$$;

-- Mensajes de una conversación, newest-first, cursor por p_before
-- (mismo patrón de paginación que get_friend_activity).
CREATE OR REPLACE FUNCTION public.get_messages(
  p_conversation_id UUID,
  p_limit  INT DEFAULT 50,
  p_before TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id         UUID,
  sender_id  UUID,
  kind       TEXT,
  body       TEXT,
  image_path TEXT,
  created_at TIMESTAMPTZ
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
  IF NOT public.is_conversation_member(p_conversation_id, v_uid) THEN
    RAISE EXCEPTION 'not_member';
  END IF;

  RETURN QUERY
  SELECT m.id, m.sender_id, m.kind, m.body, m.image_path, m.created_at
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
    AND (p_before IS NULL OR m.created_at < p_before)
  ORDER BY m.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE conversation_members
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id AND user_id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- 3. Fotos de progreso + reacciones
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.progress_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- '{uid}/posts/{ts}.jpg' dentro del bucket progress-photos
  image_path  TEXT NOT NULL,
  caption     TEXT NOT NULL DEFAULT '' CHECK (char_length(caption) <= 280),
  -- Evidencia de un hábito completado HOY → bonus al publicar y otro cuando
  -- un aliado la verifica (una verificación por post, del primer aliado).
  habit_id    UUID REFERENCES public.habits(id) ON DELETE SET NULL,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_progress_posts_user_created
  ON public.progress_posts (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.post_reactions (
  post_id    UUID NOT NULL REFERENCES public.progress_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction   TEXT NOT NULL CHECK (reaction IN ('fire', 'flex', 'clap', 'heart')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- una reacción por usuario; cambiarla es UPDATE, quitarla es DELETE
  PRIMARY KEY (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON public.post_reactions (post_id);

ALTER TABLE public.progress_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS progress_posts_select_self_or_ally ON public.progress_posts;
CREATE POLICY progress_posts_select_self_or_ally
  ON public.progress_posts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.are_allies(auth.uid(), user_id));

DROP POLICY IF EXISTS post_reactions_select_visible ON public.post_reactions;
CREATE POLICY post_reactions_select_visible
  ON public.post_reactions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.progress_posts pp
    WHERE pp.id = post_reactions.post_id
      AND (auth.uid() = pp.user_id OR public.are_allies(auth.uid(), pp.user_id))
  ));

-- Integración con el feed: el evento cascade-borra con el post (mismo patrón
-- que completion_id) y el CHECK de event_type gana 'progress_photo'.
ALTER TABLE public.activity_events
  ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.progress_posts(id) ON DELETE CASCADE;
ALTER TABLE public.activity_events DROP CONSTRAINT IF EXISTS activity_events_event_type_check;
ALTER TABLE public.activity_events ADD CONSTRAINT activity_events_event_type_check
  CHECK (event_type IN ('habit_completed', 'level_up', 'streak_milestone',
                        'mission_completed', 'progress_photo'));

-- --- RPCs de posts ---

-- Publica una foto de progreso (ya subida por el cliente a su carpeta).
-- Rate limit: 10 posts por 24h.
--
-- Con p_habit_id la foto es EVIDENCIA de un hábito completado HOY (día local
-- del perfil): otorga bonus inmediato (+10 Luz, +5 esencia) directo al
-- profile — igual que las misiones, NUNCA al weekly_leaderboard para no
-- inflar la carrera semanal. Una evidencia con bonus por hábito por día.
CREATE OR REPLACE FUNCTION public.create_progress_post(
  p_image_path TEXT,
  p_caption TEXT DEFAULT '',
  p_habit_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid          UUID := auth.uid();
  v_caption      TEXT := COALESCE(trim(p_caption), '');
  v_post         RECORD;
  v_habit_name   TEXT;
  v_tz           TEXT;
  v_today        DATE;
  v_old_level    INT;
  v_bonus_xp     INT := 0;
  v_bonus_points INT := 0;
  v_new_points   INT;
  v_new_total_xp INT;
  v_new_level    INT;
  v_payload      JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_image_path IS NULL
     OR position(v_uid || '/posts/' IN p_image_path) <> 1 THEN
    RAISE EXCEPTION 'invalid_image_path';
  END IF;
  IF char_length(v_caption) > 280 THEN
    RAISE EXCEPTION 'caption_too_long';
  END IF;
  IF (SELECT COUNT(*) FROM progress_posts pp
      WHERE pp.user_id = v_uid
        AND pp.created_at > NOW() - INTERVAL '24 hours') >= 10 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'rate_limited');
  END IF;

  IF p_habit_id IS NOT NULL THEN
    SELECT h.name INTO v_habit_name
    FROM habits h WHERE h.id = p_habit_id AND h.user_id = v_uid;
    IF v_habit_name IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'habit_not_found');
    END IF;

    SELECT COALESCE(p.timezone, 'America/Bogota'), p.level
    INTO v_tz, v_old_level
    FROM profiles p WHERE p.id = v_uid;
    v_today := (NOW() AT TIME ZONE COALESCE(v_tz, 'America/Bogota'))::date;

    IF NOT EXISTS (
      SELECT 1 FROM habit_completions hc
      WHERE hc.habit_id = p_habit_id AND hc.user_id = v_uid
        AND (hc.completed_at AT TIME ZONE v_tz)::date = v_today
    ) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'habit_not_completed_today');
    END IF;

    IF EXISTS (
      SELECT 1 FROM progress_posts pp
      WHERE pp.user_id = v_uid AND pp.habit_id = p_habit_id
        AND (pp.created_at AT TIME ZONE v_tz)::date = v_today
    ) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'evidence_already_posted');
    END IF;

    v_bonus_xp := 10;
    v_bonus_points := 5;
  END IF;

  INSERT INTO progress_posts (user_id, image_path, caption, habit_id)
  VALUES (v_uid, p_image_path, v_caption, p_habit_id)
  RETURNING id, created_at INTO v_post;

  v_payload := jsonb_build_object(
    'post_id', v_post.id,
    'caption', v_caption,
    'image_path', p_image_path
  );
  IF p_habit_id IS NOT NULL THEN
    v_payload := v_payload || jsonb_build_object(
      'habit_id', p_habit_id,
      'habit_name', v_habit_name,
      'bonus_xp', v_bonus_xp
    );
  END IF;

  INSERT INTO activity_events (user_id, event_type, payload, post_id)
  VALUES (v_uid, 'progress_photo', v_payload, v_post.id);

  IF v_bonus_xp > 0 THEN
    UPDATE profiles
    SET points = points + v_bonus_points,
        total_xp_earned = total_xp_earned + v_bonus_xp
    WHERE id = v_uid
    RETURNING points, total_xp_earned INTO v_new_points, v_new_total_xp;

    v_new_level := public.calculate_user_level(v_new_total_xp);
    UPDATE profiles SET level = v_new_level WHERE id = v_uid;
  END IF;

  UPDATE profiles SET last_active_at = NOW() WHERE id = v_uid;

  RETURN jsonb_build_object(
    'ok', true,
    'post_id', v_post.id,
    'created_at', v_post.created_at,
    'bonus_xp', v_bonus_xp,
    'bonus_points', v_bonus_points,
    'new_points', v_new_points,
    'new_total_xp', v_new_total_xp,
    'new_level', v_new_level,
    'leveled_up', v_bonus_xp > 0 AND v_new_level > v_old_level
  );
END;
$$;

-- Un aliado verifica la evidencia: bonus al autor (+15 Luz, +10 esencia,
-- una sola vez por post — el primer verificador gana la carrera) y un
-- pequeño empujón al verificador (+5 Luz) por sostener a su círculo.
CREATE OR REPLACE FUNCTION public.verify_progress_post(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid            UUID := auth.uid();
  v_post           RECORD;
  v_rows           INT;
  v_username       TEXT;
  v_author_xp      INT;
  v_old_level      INT;
  v_new_points     INT;
  v_new_total_xp   INT;
  v_new_level      INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_post FROM progress_posts pp WHERE pp.id = p_post_id;
  IF v_post IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'post_not_found');
  END IF;
  IF v_post.habit_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_evidence');
  END IF;
  IF v_post.user_id = v_uid THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'own_post');
  END IF;
  IF NOT public.are_allies(v_uid, v_post.user_id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_allies');
  END IF;

  UPDATE progress_posts
  SET verified_by = v_uid, verified_at = NOW()
  WHERE id = p_post_id AND verified_at IS NULL;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_verified');
  END IF;

  -- Bonus del autor
  UPDATE profiles
  SET points = points + 10, total_xp_earned = total_xp_earned + 15
  WHERE id = v_post.user_id
  RETURNING total_xp_earned INTO v_author_xp;
  UPDATE profiles
  SET level = public.calculate_user_level(v_author_xp)
  WHERE id = v_post.user_id;

  -- Bonus del verificador
  SELECT p.level INTO v_old_level FROM profiles p WHERE p.id = v_uid;
  UPDATE profiles
  SET total_xp_earned = total_xp_earned + 5
  WHERE id = v_uid
  RETURNING points, total_xp_earned INTO v_new_points, v_new_total_xp;
  v_new_level := public.calculate_user_level(v_new_total_xp);
  UPDATE profiles SET level = v_new_level WHERE id = v_uid;

  -- Push al autor (fn_notify_push se traga sus propios errores)
  SELECT username INTO v_username FROM profiles WHERE id = v_uid;
  PERFORM fn_notify_push(
    ARRAY[v_post.user_id],
    'post_verified',
    jsonb_build_object(
      'username', COALESCE(v_username, '???'),
      'post_id', p_post_id,
      'bonus_xp', 15,
      'bonus_points', 10
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'author_bonus_xp', 15,
    'author_bonus_points', 10,
    'verifier_bonus_xp', 5,
    'new_points', v_new_points,
    'new_total_xp', v_new_total_xp,
    'new_level', v_new_level,
    'leveled_up', v_new_level > v_old_level
  );
END;
$$;

-- Borra un post propio. Los cascades limpian el evento del feed y las
-- reacciones; el objeto de storage lo borra el cliente best-effort.
CREATE OR REPLACE FUNCTION public.delete_progress_post(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows INT;
BEGIN
  DELETE FROM progress_posts
  WHERE id = p_post_id AND user_id = auth.uid();
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN jsonb_build_object('ok', v_rows > 0);
END;
$$;

-- Toggle de reacción: misma → quitar; distinta → cambiar; ninguna → agregar.
CREATE OR REPLACE FUNCTION public.react_to_post(p_post_id UUID, p_reaction TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      UUID := auth.uid();
  v_author   UUID;
  v_current  TEXT;
  v_state    TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_reaction NOT IN ('fire', 'flex', 'clap', 'heart') THEN
    RAISE EXCEPTION 'invalid_reaction';
  END IF;

  SELECT pp.user_id INTO v_author FROM progress_posts pp WHERE pp.id = p_post_id;
  IF v_author IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'post_not_found');
  END IF;
  IF v_author <> v_uid AND NOT public.are_allies(v_uid, v_author) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_allies');
  END IF;

  SELECT pr.reaction INTO v_current
  FROM post_reactions pr
  WHERE pr.post_id = p_post_id AND pr.user_id = v_uid;

  IF v_current IS NULL THEN
    INSERT INTO post_reactions (post_id, user_id, reaction)
    VALUES (p_post_id, v_uid, p_reaction);
    v_state := 'added';
  ELSIF v_current = p_reaction THEN
    DELETE FROM post_reactions
    WHERE post_id = p_post_id AND user_id = v_uid;
    v_state := 'removed';
  ELSE
    UPDATE post_reactions SET reaction = p_reaction, created_at = NOW()
    WHERE post_id = p_post_id AND user_id = v_uid;
    v_state := 'changed';
  END IF;

  RETURN jsonb_build_object('ok', true, 'state', v_state);
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Storage: bucket privado progress-photos
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('progress-photos', 'progress-photos', false, 5242880,
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Un solo helper para las tres policies: los casts a uuid van protegidos
-- (un path malformado devuelve false en vez de romper el SELECT).
--   posts: '{uid}/posts/{ts}.jpg'   → dueño escribe/borra; aliados leen
--   chat:  'chat/{conv_id}/{uid}-{ts}.jpg' → miembros leen; remitente escribe/borra
CREATE OR REPLACE FUNCTION public.can_access_progress_photo(p_name TEXT, p_action TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seg TEXT[];
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  seg := storage.foldername(p_name);
  IF seg IS NULL OR array_length(seg, 1) < 1 THEN RETURN false; END IF;

  IF seg[1] = 'chat' THEN
    IF array_length(seg, 1) < 2 THEN RETURN false; END IF;
    IF NOT public.is_conversation_member(seg[2]::uuid, auth.uid()) THEN
      RETURN false;
    END IF;
    IF p_action IN ('insert', 'delete') THEN
      RETURN storage.filename(p_name) LIKE auth.uid()::text || '-%';
    END IF;
    RETURN true;
  END IF;

  IF seg[1] = auth.uid()::text THEN RETURN true; END IF;
  IF p_action = 'select' THEN
    RETURN public.are_allies(auth.uid(), seg[1]::uuid);
  END IF;
  RETURN false;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

DROP POLICY IF EXISTS "Progress photos readable by allies" ON storage.objects;
CREATE POLICY "Progress photos readable by allies"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'progress-photos'
         AND public.can_access_progress_photo(name, 'select'));

DROP POLICY IF EXISTS "Progress photos owner upload" ON storage.objects;
CREATE POLICY "Progress photos owner upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'progress-photos'
              AND public.can_access_progress_photo(name, 'insert'));

DROP POLICY IF EXISTS "Progress photos owner delete" ON storage.objects;
CREATE POLICY "Progress photos owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'progress-photos'
         AND public.can_access_progress_photo(name, 'delete'));

-- ----------------------------------------------------------------------------
-- 5. get_friend_activity — recreada con columnas finales aditivas
--    (post_id, image_path, reactions). RETURNS TABLE cambia → DROP + CREATE.
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_friend_activity(INT, TIMESTAMPTZ);
CREATE FUNCTION public.get_friend_activity(
  p_limit  INT DEFAULT 30,
  p_before TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id              UUID,
  user_id         UUID,
  username        VARCHAR,
  avatar_url      TEXT,
  event_type      TEXT,
  payload         JSONB,
  created_at      TIMESTAMPTZ,
  is_current_user BOOLEAN,
  post_id         UUID,
  image_path      TEXT,
  -- {"counts": {"fire": 2}, "mine": "fire"} — solo para progress_photo
  reactions       JSONB,
  -- evidencia verificada (progress_photo con habit_id)
  verified        BOOLEAN,
  verified_by_username TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Retención oportunista: mis eventos de más de 30 días (el post durable
  -- NO se borra — solo su fila de feed).
  DELETE FROM public.activity_events ae
  WHERE ae.user_id = v_user_id AND ae.created_at < NOW() - INTERVAL '30 days';

  RETURN QUERY
  WITH circle AS (
    SELECT v_user_id AS member_id
    UNION
    SELECT CASE WHEN f.user_id = v_user_id THEN f.friend_id ELSE f.user_id END
    FROM public.friendships f
    WHERE f.status = 'accepted'
      AND (f.user_id = v_user_id OR f.friend_id = v_user_id)
  )
  SELECT
    ae.id,
    ae.user_id,
    p.username,
    p.avatar_url,
    ae.event_type,
    ae.payload,
    ae.created_at,
    (ae.user_id = v_user_id) AS is_current_user,
    ae.post_id,
    pp.image_path,
    CASE WHEN ae.post_id IS NOT NULL THEN jsonb_build_object(
      'counts', COALESCE((
        SELECT jsonb_object_agg(x.reaction, x.cnt)
        FROM (SELECT pr.reaction, COUNT(*) AS cnt
              FROM public.post_reactions pr
              WHERE pr.post_id = ae.post_id
              GROUP BY pr.reaction) x
      ), '{}'::jsonb),
      'mine', (SELECT pr2.reaction FROM public.post_reactions pr2
               WHERE pr2.post_id = ae.post_id AND pr2.user_id = v_user_id)
    ) END AS reactions,
    (pp.verified_at IS NOT NULL) AS verified,
    vp.username::TEXT AS verified_by_username
  FROM public.activity_events ae
  INNER JOIN circle c ON c.member_id = ae.user_id
  INNER JOIN public.profiles p ON p.id = ae.user_id
  LEFT JOIN public.progress_posts pp ON pp.id = ae.post_id
  LEFT JOIN public.profiles vp ON vp.id = pp.verified_by
  WHERE p.username IS NOT NULL
    AND (p_before IS NULL OR ae.created_at < p_before)
  ORDER BY ae.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 30), 1), 100);
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Push: mensaje nuevo, reacción nueva, arena invite con inviter_id
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_push_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username   TEXT;
  v_recipients UUID[];
BEGIN
  BEGIN
    SELECT username INTO v_username FROM profiles WHERE id = NEW.sender_id;

    SELECT array_agg(cm.user_id) INTO v_recipients
    FROM conversation_members cm
    WHERE cm.conversation_id = NEW.conversation_id
      AND cm.user_id <> NEW.sender_id;

    IF v_recipients IS NOT NULL AND array_length(v_recipients, 1) > 0 THEN
      PERFORM fn_notify_push(
        v_recipients,
        'chat_message',
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'username', COALESCE(v_username, '???'),
          'kind', NEW.kind,
          'snippet', left(NEW.body, 80)
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- el push jamás rompe el mensaje
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_push_on_message ON public.messages;
CREATE TRIGGER trg_push_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_push_on_message();

-- Solo primera reacción (INSERT); cambiar de reacción no re-notifica.
CREATE OR REPLACE FUNCTION public.fn_push_on_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author   UUID;
  v_username TEXT;
BEGIN
  BEGIN
    SELECT pp.user_id INTO v_author FROM progress_posts pp WHERE pp.id = NEW.post_id;
    IF v_author IS NULL OR v_author = NEW.user_id THEN
      RETURN NEW;
    END IF;
    SELECT username INTO v_username FROM profiles WHERE id = NEW.user_id;
    PERFORM fn_notify_push(
      ARRAY[v_author],
      'post_reaction',
      jsonb_build_object(
        'username', COALESCE(v_username, '???'),
        'post_id', NEW.post_id,
        'reaction', NEW.reaction
      )
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_push_on_reaction ON public.post_reactions;
CREATE TRIGGER trg_push_on_reaction
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_push_on_reaction();

-- Recreado: incluye inviter_id para que send-push arme la sala del invitador
-- (room = 'el-' + inviter_id saneado) sin consulta extra.
CREATE OR REPLACE FUNCTION public.fn_push_on_arena_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
BEGIN
  SELECT username INTO v_username FROM profiles WHERE id = NEW.inviter_id;
  PERFORM fn_notify_push(
    ARRAY[NEW.invitee_id],
    'arena_invite',
    jsonb_build_object(
      'username', COALESCE(v_username, '???'),
      'invite_id', NEW.id,
      'inviter_id', NEW.inviter_id
    )
  );
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- Grants & comments
-- ----------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.are_allies(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_dm(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_message(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_messages(UUID, INT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_progress_post(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_progress_post(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.react_to_post(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_progress_post(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friend_activity(INT, TIMESTAMPTZ) TO authenticated;

COMMENT ON TABLE public.conversations IS 'Chat entre aliados. kind=dm (par único vía dm_key) hoy; kind=mission reservado para chat grupal por misión (fase 2)';
COMMENT ON TABLE public.conversation_members IS 'Membresía + last_read_at para unread counts; escrituras solo vía RPCs';
COMMENT ON TABLE public.messages IS 'Mensajes (texto/imagen). En supabase_realtime: el cliente se suscribe por conversación y la RLS de SELECT autoriza las filas';
COMMENT ON TABLE public.progress_posts IS 'Fotos de progreso (bucket privado progress-photos). Entidad durable: el evento de feed expira a 30 días, el post no';
COMMENT ON TABLE public.post_reactions IS 'Una reacción por (post, usuario); toggle vía react_to_post';
COMMENT ON FUNCTION public.can_access_progress_photo(TEXT, TEXT) IS 'Autoriza storage.objects del bucket progress-photos: posts del dueño legibles por aliados; fotos de chat solo para miembros de la conversación';
