-- ===========================================================================
-- Community hub: activity feed, shared missions, presence, ally stats
-- ===========================================================================
-- Powers the redesigned Guardianes/Aliados screen:
--   1. activity_events        — feed of friend activity (habit done, level up,
--      streak milestone, mission completed), populated by triggers so no
--      existing RPC needs edits. Habit events cascade-delete on uncomplete.
--   2. shared_missions (+participants +checkins) — seeded co-op missions with
--      one check-in per local day; reward goes straight to the profile
--      (mirrors claim_daily_focus_reward), NOT through
--      track_weekly_habit_completion so it never inflates the weekly Luz race.
--   3. profiles.last_active_at + touch_last_active() — cheap presence for
--      "Activo ahora / Activos hoy".
--   4. get_friend_list & get_weekly_leaderboard recreated with additive
--      trailing columns (last_active_at / current_streak) — old clients keep
--      working.
--   5. get_ally_stats() — aggregate tiles for the Aliados tab.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Activity feed
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL CHECK (event_type IN
                  ('habit_completed','level_up','streak_milestone','mission_completed')),
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- habit_completed only: when the completion is deleted (uncomplete), the
  -- event disappears with it.
  completion_id UUID REFERENCES public.habit_completions(id) ON DELETE CASCADE,
  -- level_up / streak_milestone / mission_completed: prevents duplicates.
  dedup_key     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_user_created
  ON public.activity_events (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_activity_events_dedup
  ON public.activity_events (user_id, dedup_key) WHERE dedup_key IS NOT NULL;

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- Reads go through get_friend_activity (SECURITY DEFINER); this policy is
-- defence in depth for direct table access. No write policies: only the
-- DEFINER trigger functions/RPCs below insert rows.
DROP POLICY IF EXISTS activity_events_select_self_or_friend ON public.activity_events;
CREATE POLICY activity_events_select_self_or_friend
  ON public.activity_events
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND ((f.user_id = auth.uid() AND f.friend_id = activity_events.user_id)
          OR (f.friend_id = auth.uid() AND f.user_id = activity_events.user_id))
    )
  );

-- Trigger: habit completed → feed event + presence touch.
-- Never lets a feed failure break the completion itself.
CREATE OR REPLACE FUNCTION public.fn_activity_on_habit_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_habit_name TEXT;
BEGIN
  BEGIN
    SELECT h.name INTO v_habit_name FROM public.habits h WHERE h.id = NEW.habit_id;

    INSERT INTO public.activity_events (user_id, event_type, payload, completion_id)
    VALUES (
      NEW.user_id,
      'habit_completed',
      jsonb_build_object(
        'habit_id', NEW.habit_id,
        'habit_name', COALESCE(v_habit_name, ''),
        'xp', COALESCE(NEW.xp_earned, 0)
      ),
      NEW.id
    );

    UPDATE public.profiles SET last_active_at = NOW() WHERE id = NEW.user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- the completion must never fail because of the feed
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_activity_habit_completion ON public.habit_completions;
CREATE TRIGGER trg_activity_habit_completion
  AFTER INSERT ON public.habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_activity_on_habit_completion();

-- Trigger: level up (from any source: habits, focus, missions).
CREATE OR REPLACE FUNCTION public.fn_activity_on_level_up()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.activity_events (user_id, event_type, payload, dedup_key)
    VALUES (
      NEW.id,
      'level_up',
      jsonb_build_object('level', NEW.level),
      'level_' || NEW.level
    )
    ON CONFLICT (user_id, dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_activity_level_up ON public.profiles;
CREATE TRIGGER trg_activity_level_up
  AFTER UPDATE OF level ON public.profiles
  FOR EACH ROW
  WHEN (NEW.level > OLD.level)
  EXECUTE FUNCTION public.fn_activity_on_level_up();

-- Trigger: streak milestones only (no daily spam). Day-scoped dedup so a
-- rebuilt streak months later can emit the same milestone again.
CREATE OR REPLACE FUNCTION public.fn_activity_on_streak_milestone()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    IF NEW.current_streak = ANY (ARRAY[3,7,14,21,30,50,100,200,365]) THEN
      INSERT INTO public.activity_events (user_id, event_type, payload, dedup_key)
      VALUES (
        NEW.user_id,
        'streak_milestone',
        jsonb_build_object('streak', NEW.current_streak),
        'streak_' || NEW.current_streak || '_' || CURRENT_DATE
      )
      ON CONFLICT (user_id, dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_activity_streak_milestone_ins ON public.streaks;
CREATE TRIGGER trg_activity_streak_milestone_ins
  AFTER INSERT ON public.streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_activity_on_streak_milestone();

DROP TRIGGER IF EXISTS trg_activity_streak_milestone_upd ON public.streaks;
CREATE TRIGGER trg_activity_streak_milestone_upd
  AFTER UPDATE ON public.streaks
  FOR EACH ROW
  WHEN (NEW.current_streak > OLD.current_streak)
  EXECUTE FUNCTION public.fn_activity_on_streak_milestone();

-- Feed RPC: my events + accepted friends', newest first, cursor pagination.
CREATE OR REPLACE FUNCTION public.get_friend_activity(
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
  is_current_user BOOLEAN
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

  -- Opportunistic retention: my events older than 30 days.
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
    (ae.user_id = v_user_id) AS is_current_user
  FROM public.activity_events ae
  INNER JOIN circle c ON c.member_id = ae.user_id
  INNER JOIN public.profiles p ON p.id = ae.user_id
  WHERE p.username IS NOT NULL
    AND (p_before IS NULL OR ae.created_at < p_before)
  ORDER BY ae.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 30), 1), 100);
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Shared missions (v1: seeded catalog, join + daily check-in)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shared_missions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  icon_name     TEXT,
  duration_days INT  NOT NULL CHECK (duration_days BETWEEN 1 AND 30),
  reward_xp     INT  NOT NULL DEFAULT 0 CHECK (reward_xp BETWEEN 0 AND 500),
  reward_points INT  NOT NULL DEFAULT 0 CHECK (reward_points BETWEEN 0 AND 500),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shared_mission_participants (
  mission_id     UUID NOT NULL REFERENCES public.shared_missions(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  days_completed INT NOT NULL DEFAULT 0,
  completed_at   TIMESTAMPTZ,               -- set once = reward already granted
  PRIMARY KEY (mission_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_smp_user ON public.shared_mission_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_smp_mission_joined
  ON public.shared_mission_participants (mission_id, joined_at);

CREATE TABLE IF NOT EXISTS public.shared_mission_checkins (
  mission_id   UUID NOT NULL,
  user_id      UUID NOT NULL,
  checkin_date DATE NOT NULL,               -- the user's LOCAL day
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (mission_id, user_id, checkin_date),
  FOREIGN KEY (mission_id, user_id)
    REFERENCES public.shared_mission_participants (mission_id, user_id) ON DELETE CASCADE
);

ALTER TABLE public.shared_missions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_mission_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_mission_checkins     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS missions_select_all ON public.shared_missions;
CREATE POLICY missions_select_all
  ON public.shared_missions FOR SELECT TO authenticated USING (true);
-- Participants are visible to everyone: username/avatar are already public
-- via v_user_public_profile and the UI shows the avatar stack.
DROP POLICY IF EXISTS participants_select_all ON public.shared_mission_participants;
CREATE POLICY participants_select_all
  ON public.shared_mission_participants FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS checkins_select_own ON public.shared_mission_checkins;
CREATE POLICY checkins_select_own
  ON public.shared_mission_checkins FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Writes only through the SECURITY DEFINER RPCs below.

INSERT INTO public.shared_missions (code, title, description, icon_name, duration_days, reward_xp) VALUES
  ('hydration_7',  'Tomar agua',         '7 días de hidratación consciente', 'Droplets', 7, 200),
  ('early_bird_5', 'Despertar temprano', '5 días madrugando',                'Sunrise',  5, 150),
  ('move_7',       'Moverse 20 min',     '7 días de movimiento diario',      'Dumbbell', 7, 200),
  ('mindful_3',    'Respirar y meditar', '3 días de pausa consciente',       'Sprout',   3, 80)
ON CONFLICT (code) DO NOTHING;

-- List missions with the avatar stack and the caller's state.
CREATE OR REPLACE FUNCTION public.get_shared_missions()
RETURNS TABLE (
  mission_id          UUID,
  code                TEXT,
  title               TEXT,
  description         TEXT,
  icon_name           TEXT,
  duration_days       INT,
  reward_xp           INT,
  reward_points       INT,
  participant_count   INT,
  participant_avatars JSONB,
  is_joined           BOOLEAN,
  my_days_completed   INT,
  my_checked_in_today BOOLEAN,
  my_completed        BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_tz      TEXT;
  v_today   DATE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(p.timezone, 'America/Bogota') INTO v_tz
  FROM public.profiles p WHERE p.id = v_user_id;
  v_today := (NOW() AT TIME ZONE COALESCE(v_tz, 'America/Bogota'))::date;

  RETURN QUERY
  SELECT
    m.id,
    m.code,
    m.title,
    m.description,
    m.icon_name,
    m.duration_days,
    m.reward_xp,
    m.reward_points,
    (SELECT COUNT(*)::INT
       FROM public.shared_mission_participants smp
      WHERE smp.mission_id = m.id) AS participant_count,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'user_id', pa.user_id,
               'username', pa.username,
               'avatar_url', pa.avatar_url))
      FROM (
        SELECT smp.user_id, pr.username, pr.avatar_url
        FROM public.shared_mission_participants smp
        INNER JOIN public.profiles pr ON pr.id = smp.user_id
        WHERE smp.mission_id = m.id AND pr.username IS NOT NULL
        ORDER BY smp.joined_at
        LIMIT 4
      ) pa
    ), '[]'::jsonb) AS participant_avatars,
    (me.user_id IS NOT NULL) AS is_joined,
    COALESCE(me.days_completed, 0) AS my_days_completed,
    EXISTS (
      SELECT 1 FROM public.shared_mission_checkins ck
      WHERE ck.mission_id = m.id AND ck.user_id = v_user_id AND ck.checkin_date = v_today
    ) AS my_checked_in_today,
    (me.completed_at IS NOT NULL) AS my_completed
  FROM public.shared_missions m
  LEFT JOIN public.shared_mission_participants me
    ON me.mission_id = m.id AND me.user_id = v_user_id
  WHERE m.is_active
  ORDER BY m.created_at, m.code;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_shared_mission(p_mission_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_rows    INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.shared_missions m WHERE m.id = p_mission_id AND m.is_active
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'mission_not_found');
  END IF;

  INSERT INTO public.shared_mission_participants (mission_id, user_id)
  VALUES (p_mission_id, v_user_id)
  ON CONFLICT (mission_id, user_id) DO NOTHING;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_joined');
  END IF;

  UPDATE public.profiles SET last_active_at = NOW() WHERE id = v_user_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- One check-in per local day; grants the reward exactly once on completion
-- (profile points/XP + level recalc, mirroring claim_daily_focus_reward).
CREATE OR REPLACE FUNCTION public.checkin_shared_mission(p_mission_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id      UUID;
  v_tz           TEXT;
  v_today        DATE;
  v_mission      RECORD;
  v_participant  RECORD;
  v_rows         INT;
  v_days         INT;
  v_completed    BOOLEAN := false;
  v_old_level    INT;
  v_new_points   INT;
  v_new_total_xp INT;
  v_new_level    INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_mission
  FROM public.shared_missions m
  WHERE m.id = p_mission_id AND m.is_active;
  IF v_mission IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'mission_not_found');
  END IF;

  SELECT * INTO v_participant
  FROM public.shared_mission_participants smp
  WHERE smp.mission_id = p_mission_id AND smp.user_id = v_user_id;
  IF v_participant IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_joined');
  END IF;
  IF v_participant.completed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_completed');
  END IF;

  SELECT COALESCE(p.timezone, 'America/Bogota'), p.level
  INTO v_tz, v_old_level
  FROM public.profiles p WHERE p.id = v_user_id;
  v_today := (NOW() AT TIME ZONE COALESCE(v_tz, 'America/Bogota'))::date;

  INSERT INTO public.shared_mission_checkins (mission_id, user_id, checkin_date)
  VALUES (p_mission_id, v_user_id, v_today)
  ON CONFLICT (mission_id, user_id, checkin_date) DO NOTHING;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_checked_in');
  END IF;

  UPDATE public.shared_mission_participants smp
  SET days_completed = smp.days_completed + 1
  WHERE smp.mission_id = p_mission_id AND smp.user_id = v_user_id
  RETURNING smp.days_completed INTO v_days;

  UPDATE public.profiles SET last_active_at = NOW() WHERE id = v_user_id;

  IF v_days >= v_mission.duration_days THEN
    v_completed := true;

    UPDATE public.shared_mission_participants smp
    SET completed_at = NOW()
    WHERE smp.mission_id = p_mission_id AND smp.user_id = v_user_id;

    UPDATE public.profiles
    SET points = points + v_mission.reward_points,
        total_xp_earned = total_xp_earned + v_mission.reward_xp
    WHERE id = v_user_id
    RETURNING points, total_xp_earned INTO v_new_points, v_new_total_xp;

    v_new_level := public.calculate_user_level(v_new_total_xp);
    UPDATE public.profiles SET level = v_new_level WHERE id = v_user_id;

    INSERT INTO public.activity_events (user_id, event_type, payload, dedup_key)
    VALUES (
      v_user_id,
      'mission_completed',
      jsonb_build_object(
        'mission_id', p_mission_id,
        'mission_code', v_mission.code,
        'mission_title', v_mission.title,
        'reward_xp', v_mission.reward_xp
      ),
      'mission_completed_' || p_mission_id
    )
    ON CONFLICT (user_id, dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'days_completed', v_days,
    'mission_completed', v_completed,
    'xp_awarded', CASE WHEN v_completed THEN v_mission.reward_xp ELSE 0 END,
    'points_awarded', CASE WHEN v_completed THEN v_mission.reward_points ELSE 0 END,
    'new_points', v_new_points,
    'new_total_xp', v_new_total_xp,
    'new_level', v_new_level,
    'leveled_up', v_completed AND v_new_level > v_old_level
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Presence
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.touch_last_active()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.profiles
  SET last_active_at = NOW()
  WHERE id = auth.uid()
    AND (last_active_at IS NULL OR last_active_at < NOW() - INTERVAL '5 minutes');
$$;

-- Additive column at the end: CREATE OR REPLACE VIEW allows appending.
CREATE OR REPLACE VIEW v_user_public_profile AS
SELECT
  p.id,
  p.username,
  p.level,
  p.avatar_url,
  p.total_xp_earned,
  p.points,
  p.created_at,
  COALESCE(s.current_streak, 0) AS current_streak,
  COALESCE(s.longest_streak, 0) AS longest_streak,
  p.last_active_at
FROM profiles p
LEFT JOIN streaks s ON p.id = s.user_id
WHERE p.username IS NOT NULL;

GRANT SELECT ON v_user_public_profile TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Recreate read RPCs with additive trailing columns
-- ---------------------------------------------------------------------------
-- RETURNS TABLE changes require DROP (CREATE OR REPLACE cannot alter it).
DROP FUNCTION IF EXISTS public.get_friend_list(UUID);
CREATE FUNCTION public.get_friend_list(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  friendship_id UUID,
  user_id UUID,
  username VARCHAR,
  level INT,
  avatar_url TEXT,
  current_streak INT,
  longest_streak INT,
  total_xp_earned INT,
  points INT,
  friendship_status friendship_status,
  friendship_created_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  -- Accepted friendships are stored in BOTH directions (accept_friend_request
  -- inserts a reciprocal row), so dedup per friend or each ally shows twice.
  RETURN QUERY
  SELECT * FROM (
    SELECT DISTINCT ON (vp.id)
      f.id AS friendship_id,
      vp.id AS user_id,
      vp.username,
      vp.level,
      vp.avatar_url,
      vp.current_streak,
      vp.longest_streak,
      vp.total_xp_earned,
      vp.points,
      f.status AS friendship_status,
      f.created_at AS friendship_created_at,
      vp.last_active_at
    FROM friendships f
    INNER JOIN v_user_public_profile vp ON
      CASE
        WHEN f.user_id = v_user_id THEN f.friend_id = vp.id
        WHEN f.friend_id = v_user_id THEN f.user_id = vp.id
      END
    WHERE (f.user_id = v_user_id OR f.friend_id = v_user_id)
      AND f.status = 'accepted'
    ORDER BY vp.id, f.created_at
  ) t
  ORDER BY t.level DESC, t.total_xp_earned DESC;
END;
$$;

DROP FUNCTION IF EXISTS public.get_weekly_leaderboard(UUID, INT, DATE);
CREATE FUNCTION public.get_weekly_leaderboard(
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_week_start DATE DEFAULT NULL
)
RETURNS TABLE(
  rank INT,
  user_id UUID,
  username VARCHAR,
  avatar_url TEXT,
  weekly_xp_earned INT,
  weekly_points_earned INT,
  habits_completed INT,
  is_current_user BOOLEAN,
  level INT,
  current_streak INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_start DATE;
BEGIN
  IF p_week_start IS NULL THEN
    SELECT week_start INTO v_week_start FROM get_current_week_range();
  ELSE
    v_week_start := p_week_start;
  END IF;

  PERFORM update_current_week_ranks();

  RETURN QUERY
  WITH top_users AS (
    SELECT
      wl.rank,
      wl.user_id,
      p.username,
      p.avatar_url,
      wl.weekly_xp_earned,
      wl.weekly_points_earned,
      wl.habits_completed,
      (wl.user_id = p_user_id) AS is_current_user,
      p.level,
      COALESCE(s.current_streak, 0) AS current_streak
    FROM weekly_leaderboard wl
    INNER JOIN profiles p ON wl.user_id = p.id
    LEFT JOIN streaks s ON s.user_id = wl.user_id
    WHERE wl.week_start_date = v_week_start
      AND p.username IS NOT NULL
    ORDER BY wl.rank
    LIMIT p_limit
  ),
  user_entry AS (
    SELECT
      wl.rank,
      wl.user_id,
      p.username,
      p.avatar_url,
      wl.weekly_xp_earned,
      wl.weekly_points_earned,
      wl.habits_completed,
      true AS is_current_user,
      p.level,
      COALESCE(s.current_streak, 0) AS current_streak
    FROM weekly_leaderboard wl
    INNER JOIN profiles p ON wl.user_id = p.id
    LEFT JOIN streaks s ON s.user_id = wl.user_id
    WHERE wl.user_id = p_user_id
      AND wl.week_start_date = v_week_start
      AND wl.rank > p_limit
  )
  SELECT * FROM top_users
  UNION ALL
  SELECT * FROM user_entry
  ORDER BY rank;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Ally stats (Aliados tab tiles)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_ally_stats()
RETURNS TABLE (
  total_allies         INT,
  active_today         INT,
  active_now           INT,
  shared_weekly_xp     INT,
  shared_weekly_points INT,
  best_streak          INT,
  best_streak_username TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id     UUID;
  v_tz          TEXT;
  v_today_start TIMESTAMPTZ;
  v_week_start  DATE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(p.timezone, 'America/Bogota') INTO v_tz
  FROM public.profiles p WHERE p.id = v_user_id;
  v_tz := COALESCE(v_tz, 'America/Bogota');
  -- Start of MY local day, as an absolute instant.
  v_today_start := ((NOW() AT TIME ZONE v_tz)::date::timestamp AT TIME ZONE v_tz);

  SELECT week_start INTO v_week_start FROM get_current_week_range();

  RETURN QUERY
  WITH allies AS (
    -- DISTINCT: accepted friendships exist in both directions (see get_friend_list)
    SELECT DISTINCT CASE WHEN f.user_id = v_user_id THEN f.friend_id ELSE f.user_id END AS ally_id
    FROM public.friendships f
    WHERE f.status = 'accepted'
      AND (f.user_id = v_user_id OR f.friend_id = v_user_id)
  ),
  circle AS (
    SELECT v_user_id AS member_id
    UNION
    SELECT ally_id FROM allies
  )
  SELECT
    (SELECT COUNT(*)::INT FROM allies),
    (SELECT COUNT(*)::INT FROM public.profiles p
      INNER JOIN allies a ON a.ally_id = p.id
      WHERE p.last_active_at >= v_today_start),
    (SELECT COUNT(*)::INT FROM public.profiles p
      INNER JOIN allies a ON a.ally_id = p.id
      WHERE p.last_active_at >= NOW() - INTERVAL '5 minutes'),
    COALESCE((SELECT SUM(wl.weekly_xp_earned)::INT FROM public.weekly_leaderboard wl
      INNER JOIN circle c ON c.member_id = wl.user_id
      WHERE wl.week_start_date = v_week_start), 0),
    COALESCE((SELECT SUM(wl.weekly_points_earned)::INT FROM public.weekly_leaderboard wl
      INNER JOIN circle c ON c.member_id = wl.user_id
      WHERE wl.week_start_date = v_week_start), 0),
    COALESCE((SELECT MAX(s.current_streak)::INT FROM public.streaks s
      INNER JOIN circle c ON c.member_id = s.user_id), 0),
    (SELECT p.username::TEXT FROM public.streaks s
      INNER JOIN circle c ON c.member_id = s.user_id
      INNER JOIN public.profiles p ON p.id = s.user_id
      WHERE p.username IS NOT NULL
      ORDER BY s.current_streak DESC, p.username
      LIMIT 1);
END;
$$;

-- ---------------------------------------------------------------------------
-- Grants & comments
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_friend_activity(INT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_missions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_shared_mission(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.checkin_shared_mission(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_last_active() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friend_list(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_leaderboard(UUID, INT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ally_stats() TO authenticated;

COMMENT ON TABLE public.activity_events IS 'Friend activity feed events, written by triggers/RPCs only; 30-day retention enforced opportunistically in get_friend_activity';
COMMENT ON TABLE public.shared_missions IS 'Seeded co-op mission catalog (v1: no user-created missions)';
COMMENT ON TABLE public.shared_mission_participants IS 'Per-user mission membership and denormalized progress; completed_at set once when the reward is granted';
COMMENT ON TABLE public.shared_mission_checkins IS 'One row per (mission, user, local day) — the PK enforces a single daily check-in';
COMMENT ON FUNCTION public.get_friend_activity(INT, TIMESTAMPTZ) IS 'Feed of my + accepted friends'' events, newest first, cursor via p_before';
COMMENT ON FUNCTION public.get_shared_missions() IS 'Active missions with avatar stack and the caller''s join/progress/check-in state';
COMMENT ON FUNCTION public.checkin_shared_mission(UUID) IS 'Daily mission check-in; on reaching duration_days grants reward to the profile (NOT to weekly_leaderboard, so the weekly Luz race stays habit-only)';
COMMENT ON FUNCTION public.touch_last_active() IS 'Presence heartbeat, throttled server-side to once per 5 minutes';
COMMENT ON FUNCTION public.get_ally_stats() IS 'Aliados tab tiles: ally count, active today/now, shared weekly XP/points of my circle, best streak in the circle';
COMMENT ON COLUMN public.profiles.last_active_at IS 'Last presence heartbeat or activity (habit completion, mission action)';
