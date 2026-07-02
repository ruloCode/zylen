-- ===========================================================================
-- Focus Gems (Forest-style Pomodoro focus sessions)
-- ===========================================================================
-- Feature: "Enfoque del día". Users create gems (tags) tied to a species
-- (= life-area slug) and optionally to a habit or a free-form activity.
-- Client-timed sessions are anchored server-side:
--   * start_focus_session   -> creates the 'running' row (server timestamp)
--   * complete_focus_session-> validates the elapsed window, awards XP/points
--                              (1 XP/min, own soft daily cap), feeds profiles
--                              and the species' life area, returns a sync
--                              payload shaped like complete_habit's.
--   * break_focus_session   -> marks the gem broken (no XP), kept for stats.
--   * get_focus_stats       -> vault + Arena species counts in one round-trip.
-- Broken/completed rows are both kept (the vault shows dead gems too).
-- A partial unique index guarantees at most ONE running session per user,
-- which doubles as the double-award/idempotency guard.
-- Species table is future-shop ready (is_default/price_points).
-- Idempotent DDL. Writes to focus_sessions only via SECURITY DEFINER RPCs.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.focus_gem_species (
  key           TEXT PRIMARY KEY,
  life_area_key TEXT,
  is_default    BOOLEAN NOT NULL DEFAULT true,
  price_points  INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.focus_gem_species (key, life_area_key, is_default, price_points, sort_order)
VALUES
  ('health',     'health',     true, 0, 1),
  ('finance',    'finance',    true, 0, 2),
  ('creativity', 'creativity', true, 0, 3),
  ('social',     'social',     true, 0, 4),
  ('family',     'family',     true, 0, 5),
  ('career',     'career',     true, 0, 6)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.focus_gems (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  species     TEXT NOT NULL REFERENCES public.focus_gem_species(key),
  habit_id    UUID REFERENCES public.habits(id) ON DELETE SET NULL,
  activity    TEXT CHECK (char_length(activity) <= 80),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS focus_gems_user_idx
  ON public.focus_gems(user_id) WHERE NOT is_archived;

CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gem_id           UUID REFERENCES public.focus_gems(id) ON DELETE SET NULL,
  species          TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 10 AND 180),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at         TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'running'
                     CHECK (status IN ('running', 'completed', 'broken')),
  paused_ms        INTEGER NOT NULL DEFAULT 0,
  break_reason     TEXT CHECK (break_reason IN ('paused_too_long', 'abandoned', 'expired')),
  xp_awarded       INTEGER NOT NULL DEFAULT 0,
  points_awarded   INTEGER NOT NULL DEFAULT 0,
  life_area_id     UUID REFERENCES public.life_areas(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS focus_sessions_one_running
  ON public.focus_sessions(user_id) WHERE status = 'running';

CREATE INDEX IF NOT EXISTS focus_sessions_user_status_idx
  ON public.focus_sessions(user_id, status, started_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.focus_gem_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_gems       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions   ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'focus_gem_species' AND policyname = 'focus_gem_species_select') THEN
    CREATE POLICY focus_gem_species_select ON public.focus_gem_species
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'focus_gems' AND policyname = 'focus_gems_select_own') THEN
    CREATE POLICY focus_gems_select_own ON public.focus_gems
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'focus_gems' AND policyname = 'focus_gems_insert_own') THEN
    CREATE POLICY focus_gems_insert_own ON public.focus_gems
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'focus_gems' AND policyname = 'focus_gems_update_own') THEN
    CREATE POLICY focus_gems_update_own ON public.focus_gems
      FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'focus_gems' AND policyname = 'focus_gems_delete_own') THEN
    CREATE POLICY focus_gems_delete_own ON public.focus_gems
      FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- focus_sessions: read own; ALL writes flow through SECURITY DEFINER RPCs.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'focus_sessions_select_own') THEN
    CREATE POLICY focus_sessions_select_own ON public.focus_sessions
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- start_focus_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_focus_session(
  p_gem_id UUID,
  p_duration_minutes INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_gem RECORD;
  v_stale RECORD;
  v_session_id UUID;
  v_started_at TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_duration_minutes IS NULL OR p_duration_minutes < 10 OR p_duration_minutes > 180 THEN
    RAISE EXCEPTION 'invalid_duration';
  END IF;

  SELECT * INTO v_gem
  FROM public.focus_gems
  WHERE id = p_gem_id AND user_id = v_user_id AND NOT is_archived;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'gem_not_found';
  END IF;

  -- Auto-expire a stale running session (client vanished long ago); a fresh
  -- one is a real conflict.
  SELECT * INTO v_stale
  FROM public.focus_sessions
  WHERE user_id = v_user_id AND status = 'running';

  IF FOUND THEN
    IF now() > v_stale.started_at
                + make_interval(mins => v_stale.duration_minutes)
                + INTERVAL '30 minutes' THEN
      UPDATE public.focus_sessions
      SET status = 'broken', break_reason = 'expired', ended_at = now()
      WHERE id = v_stale.id;
    ELSE
      RAISE EXCEPTION 'session_already_running';
    END IF;
  END IF;

  INSERT INTO public.focus_sessions (user_id, gem_id, species, duration_minutes)
  VALUES (v_user_id, p_gem_id, v_gem.species, p_duration_minutes)
  RETURNING id, started_at INTO v_session_id, v_started_at;

  RETURN jsonb_build_object(
    'session_id', v_session_id,
    'started_at', v_started_at,
    'species', v_gem.species
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.start_focus_session(UUID, INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- complete_focus_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_focus_session(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_session RECORD;
  v_user_timezone TEXT;
  v_today_date DATE;
  v_today_start TIMESTAMP;
  v_today_end TIMESTAMP;

  v_min_end TIMESTAMPTZ;
  v_max_end TIMESTAMPTZ;

  v_today_xp INTEGER;
  v_damping NUMERIC := 1.0;
  v_xp_awarded INTEGER;
  v_points_awarded INTEGER;
  v_capped BOOLEAN := false;

  v_old_level INTEGER;
  v_new_level INTEGER;
  v_new_total_xp INTEGER;
  v_new_points INTEGER;

  v_life_area RECORD;
  v_old_area_level INTEGER;
  v_new_life_area_xp INTEGER;
  v_new_life_area_level INTEGER;
  v_life_area_json JSONB := NULL;

  v_species_counts JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Guarded transition: only ONE caller can flip running -> completed.
  UPDATE public.focus_sessions
  SET status = 'completed', ended_at = now()
  WHERE id = p_session_id AND user_id = v_user_id AND status = 'running'
  RETURNING * INTO v_session;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'session_not_running';
  END IF;

  -- Server-side window: the session must have actually lasted its duration
  -- (30s grace) and not overrun the pause budget (3 min) + return grace (10 min).
  v_min_end := v_session.started_at
                + make_interval(mins => v_session.duration_minutes)
                - INTERVAL '30 seconds';
  v_max_end := v_session.started_at
                + make_interval(mins => v_session.duration_minutes)
                + INTERVAL '13 minutes';

  IF now() < v_min_end OR now() > v_max_end THEN
    UPDATE public.focus_sessions
    SET status = 'broken',
        break_reason = CASE WHEN now() < v_min_end THEN 'abandoned' ELSE 'expired' END
    WHERE id = p_session_id;

    RETURN jsonb_build_object(
      'session_id', p_session_id,
      'broken', true,
      'reason', CASE WHEN now() < v_min_end THEN 'abandoned' ELSE 'expired' END
    );
  END IF;

  SELECT COALESCE(timezone, 'America/Bogota'), level, points
  INTO v_user_timezone, v_old_level, v_new_points
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_timezone IS NULL THEN
    v_user_timezone := 'America/Bogota';
  END IF;

  v_today_date := (NOW() AT TIME ZONE v_user_timezone)::date;
  v_today_start := (v_today_date::timestamp AT TIME ZONE v_user_timezone) AT TIME ZONE 'UTC';
  v_today_end := v_today_start + INTERVAL '1 day' - INTERVAL '1 second';

  -- Focus-specific soft daily cap: full rate < 120 focus-XP today, 50% < 180,
  -- 20% beyond (independent from the habit cap).
  SELECT COALESCE(SUM(xp_awarded), 0) INTO v_today_xp
  FROM public.focus_sessions
  WHERE user_id = v_user_id
    AND status = 'completed'
    AND id <> p_session_id
    AND ended_at >= v_today_start
    AND ended_at <= v_today_end;

  IF v_today_xp >= 180 THEN
    v_damping := 0.2;
  ELSIF v_today_xp >= 120 THEN
    v_damping := 0.5;
  END IF;

  v_xp_awarded := GREATEST(1, ROUND(v_session.duration_minutes * v_damping));
  v_points_awarded := GREATEST(1, ROUND(v_xp_awarded * 0.5));
  v_capped := v_damping < 1.0;

  UPDATE public.focus_sessions
  SET xp_awarded = v_xp_awarded, points_awarded = v_points_awarded
  WHERE id = p_session_id;

  -- Profile: points, XP, level
  UPDATE public.profiles
  SET points = points + v_points_awarded,
      total_xp_earned = total_xp_earned + v_xp_awarded
  WHERE id = v_user_id
  RETURNING points, total_xp_earned INTO v_new_points, v_new_total_xp;

  v_new_level := public.calculate_user_level(v_new_total_xp);

  UPDATE public.profiles
  SET level = v_new_level
  WHERE id = v_user_id;

  -- Life area for the species (skip silently when disabled/missing)
  SELECT * INTO v_life_area
  FROM public.life_areas
  WHERE user_id = v_user_id
    AND enabled = true
    AND lower(area_type::text) = v_session.species
  LIMIT 1;

  IF FOUND THEN
    v_old_area_level := v_life_area.level;

    UPDATE public.life_areas
    SET total_xp = total_xp + v_xp_awarded
    WHERE id = v_life_area.id
    RETURNING total_xp INTO v_new_life_area_xp;

    v_new_life_area_level := public.calculate_life_area_level(v_new_life_area_xp);

    UPDATE public.life_areas
    SET level = v_new_life_area_level
    WHERE id = v_life_area.id;

    UPDATE public.focus_sessions
    SET life_area_id = v_life_area.id
    WHERE id = p_session_id;

    v_life_area_json := jsonb_build_object(
      'id', v_life_area.id,
      'total_xp', v_new_life_area_xp,
      'level', v_new_life_area_level,
      'leveled_up', v_new_life_area_level > COALESCE(v_old_area_level, v_new_life_area_level)
    );
  END IF;

  -- Completed-gem counts per species (feeds Arena buffs with no extra query)
  SELECT COALESCE(jsonb_object_agg(species, cnt), '{}'::jsonb)
  INTO v_species_counts
  FROM (
    SELECT species, COUNT(*)::int AS cnt
    FROM public.focus_sessions
    WHERE user_id = v_user_id AND status = 'completed'
    GROUP BY species
  ) t;

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'broken', false,
    'xp_awarded', v_xp_awarded,
    'capped', v_capped,
    'points_awarded', v_points_awarded,
    'new_total_xp', v_new_total_xp,
    'new_level', v_new_level,
    'leveled_up', v_new_level > v_old_level,
    'new_points', v_new_points,
    'life_area', v_life_area_json,
    'species_counts', v_species_counts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.complete_focus_session(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- break_focus_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.break_focus_session(
  p_session_id UUID,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_session RECORD;
  v_reason TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_reason := CASE WHEN p_reason IN ('paused_too_long', 'abandoned', 'expired')
                   THEN p_reason ELSE 'abandoned' END;

  UPDATE public.focus_sessions
  SET status = 'broken', break_reason = v_reason, ended_at = now()
  WHERE id = p_session_id AND user_id = v_user_id AND status = 'running'
  RETURNING * INTO v_session;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'session_not_running';
  END IF;

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'status', 'broken',
    'reason', v_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.break_focus_session(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- get_focus_stats
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_focus_stats()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_user_timezone TEXT;
  v_today_date DATE;
  v_today_start TIMESTAMP;
  v_today_end TIMESTAMP;
  v_week_start TIMESTAMP;

  v_species_counts JSONB;
  v_today JSONB;
  v_week JSONB;
  v_recent JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(timezone, 'America/Bogota') INTO v_user_timezone
  FROM public.profiles WHERE id = v_user_id;
  IF v_user_timezone IS NULL THEN
    v_user_timezone := 'America/Bogota';
  END IF;

  v_today_date := (NOW() AT TIME ZONE v_user_timezone)::date;
  v_today_start := (v_today_date::timestamp AT TIME ZONE v_user_timezone) AT TIME ZONE 'UTC';
  v_today_end := v_today_start + INTERVAL '1 day' - INTERVAL '1 second';
  -- Rolling 7-day window (including today)
  v_week_start := v_today_start - INTERVAL '6 days';

  SELECT COALESCE(jsonb_object_agg(species, cnt), '{}'::jsonb)
  INTO v_species_counts
  FROM (
    SELECT species, COUNT(*)::int AS cnt
    FROM public.focus_sessions
    WHERE user_id = v_user_id AND status = 'completed'
    GROUP BY species
  ) t;

  SELECT jsonb_build_object(
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'broken',    COUNT(*) FILTER (WHERE status = 'broken'),
    'minutes',   COALESCE(SUM(duration_minutes) FILTER (WHERE status = 'completed'), 0),
    'xp',        COALESCE(SUM(xp_awarded) FILTER (WHERE status = 'completed'), 0)
  ) INTO v_today
  FROM public.focus_sessions
  WHERE user_id = v_user_id
    AND ended_at >= v_today_start AND ended_at <= v_today_end;

  SELECT jsonb_build_object(
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'broken',    COUNT(*) FILTER (WHERE status = 'broken'),
    'minutes',   COALESCE(SUM(duration_minutes) FILTER (WHERE status = 'completed'), 0),
    'xp',        COALESCE(SUM(xp_awarded) FILTER (WHERE status = 'completed'), 0)
  ) INTO v_week
  FROM public.focus_sessions
  WHERE user_id = v_user_id
    AND ended_at >= v_week_start AND ended_at <= v_today_end;

  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
  INTO v_recent
  FROM (
    SELECT s.id, s.species, s.duration_minutes, s.started_at, s.ended_at,
           s.status, s.break_reason, s.xp_awarded, g.name AS gem_name
    FROM public.focus_sessions s
    LEFT JOIN public.focus_gems g ON g.id = s.gem_id
    WHERE s.user_id = v_user_id AND s.status <> 'running'
    ORDER BY s.ended_at DESC NULLS LAST
    LIMIT 50
  ) r;

  RETURN jsonb_build_object(
    'species_counts', v_species_counts,
    'today', v_today,
    'week', v_week,
    'recent_sessions', v_recent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_focus_stats() TO authenticated;

COMMENT ON FUNCTION public.start_focus_session IS 'Start a focus session for a gem: one running per user, stale sessions auto-expire; returns {session_id, started_at, species}';
COMMENT ON FUNCTION public.complete_focus_session IS 'Atomically complete a running focus session: server window validation, 1 XP/min with focus daily soft cap, feeds profile + species life area; returns sync payload + species_counts';
COMMENT ON FUNCTION public.break_focus_session IS 'Mark a running focus session as broken (no XP); rows are kept for vault stats';
COMMENT ON FUNCTION public.get_focus_stats IS 'Vault + Arena data in one call: species counts, today/week aggregates, recent sessions';
