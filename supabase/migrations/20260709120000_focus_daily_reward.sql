-- ===========================================================================
-- Daily focus challenge — claimable reward (Esencia + Luz)
-- ===========================================================================
-- The home banner became a daily challenge: reach a focus-minutes goal today
-- and claim a once-per-day reward that strengthens the hero (XP → level) and
-- grants spendable Esencia. This migration adds:
--   1. focus_daily_reward_claims — one row per (user, local day) claimed.
--   2. claim_daily_focus_reward() — validates the goal, is idempotent per local
--      day, and awards points + XP to the profile (mirrors complete_focus_session).
--   3. get_focus_stats() v3 — adds `today_reward_claimed` so the client learns
--      the claim state in the same call it already makes on load.
-- The minutes goal and reward amounts are passed by the client from
-- FOCUS_CONFIG.dailyChallenge but clamped server-side so they can't be inflated.
-- ===========================================================================

-- 1. Claim ledger ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.focus_daily_reward_claims (
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_date     DATE NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  xp_awarded     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, claim_date)
);

ALTER TABLE public.focus_daily_reward_claims ENABLE ROW LEVEL SECURITY;

-- Reads only ever go through the SECURITY DEFINER RPCs below, but scope direct
-- access to the owner anyway (defence in depth). Writes stay RPC-only.
DROP POLICY IF EXISTS focus_daily_reward_claims_select_own
  ON public.focus_daily_reward_claims;
CREATE POLICY focus_daily_reward_claims_select_own
  ON public.focus_daily_reward_claims
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Claim RPC ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_daily_focus_reward(
  p_minutes_goal  INTEGER,
  p_reward_points INTEGER,
  p_reward_xp     INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_user_id       UUID;
  v_user_timezone TEXT;
  v_today_date    DATE;
  v_today_start   TIMESTAMP;
  v_today_end     TIMESTAMP;
  v_minutes       INTEGER;
  v_old_level     INTEGER;
  v_new_points    INTEGER;
  v_new_total_xp  INTEGER;
  v_new_level     INTEGER;
  v_rows          INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Clamp inputs so a tampered client can't inflate the goal/reward.
  p_minutes_goal  := GREATEST(1, COALESCE(p_minutes_goal, 25));
  p_reward_points := GREATEST(0, LEAST(COALESCE(p_reward_points, 0), 100));
  p_reward_xp     := GREATEST(0, LEAST(COALESCE(p_reward_xp, 0), 100));

  SELECT COALESCE(timezone, 'America/Bogota'), level
  INTO v_user_timezone, v_old_level
  FROM public.profiles WHERE id = v_user_id;
  IF v_user_timezone IS NULL THEN
    v_user_timezone := 'America/Bogota';
  END IF;

  -- Same day window as get_focus_stats (user-timezone aware).
  v_today_date  := (NOW() AT TIME ZONE v_user_timezone)::date;
  v_today_start := (v_today_date::timestamp AT TIME ZONE v_user_timezone) AT TIME ZONE 'UTC';
  v_today_end   := v_today_start + INTERVAL '1 day' - INTERVAL '1 second';

  SELECT COALESCE(SUM(duration_minutes) FILTER (WHERE status = 'completed'), 0)
  INTO v_minutes
  FROM public.focus_sessions
  WHERE user_id = v_user_id
    AND ended_at >= v_today_start AND ended_at <= v_today_end;

  IF v_minutes < p_minutes_goal THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'goal_not_met');
  END IF;

  -- Idempotent per local day: a PK conflict means it was already claimed.
  INSERT INTO public.focus_daily_reward_claims
    (user_id, claim_date, points_awarded, xp_awarded)
  VALUES (v_user_id, v_today_date, p_reward_points, p_reward_xp)
  ON CONFLICT (user_id, claim_date) DO NOTHING;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END IF;

  UPDATE public.profiles
  SET points = points + p_reward_points,
      total_xp_earned = total_xp_earned + p_reward_xp
  WHERE id = v_user_id
  RETURNING points, total_xp_earned INTO v_new_points, v_new_total_xp;

  v_new_level := public.calculate_user_level(v_new_total_xp);
  UPDATE public.profiles SET level = v_new_level WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'points_awarded', p_reward_points,
    'xp_awarded', p_reward_xp,
    'new_points', v_new_points,
    'new_total_xp', v_new_total_xp,
    'new_level', v_new_level,
    'leveled_up', v_new_level > v_old_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.claim_daily_focus_reward(INTEGER, INTEGER, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.claim_daily_focus_reward IS 'Claim the daily focus-challenge reward once per local day when the minutes goal is met; awards clamped points + XP to the profile.';

-- 3. get_focus_stats v3 — adds today_reward_claimed --------------------------
CREATE OR REPLACE FUNCTION public.get_focus_stats()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_user_timezone TEXT;
  v_today_date DATE;
  v_today_start TIMESTAMP;
  v_today_end TIMESTAMP;
  v_week_start TIMESTAMP;
  v_month_start TIMESTAMP;
  v_year_start TIMESTAMP;

  v_species_counts JSONB;
  v_today JSONB;
  v_week JSONB;
  v_month JSONB;
  v_year JSONB;
  v_recent JSONB;
  v_reward_claimed BOOLEAN;
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
  v_week_start := v_today_start - INTERVAL '6 days';
  v_month_start := (date_trunc('month', NOW() AT TIME ZONE v_user_timezone)
                     AT TIME ZONE v_user_timezone) AT TIME ZONE 'UTC';
  v_year_start := (date_trunc('year', NOW() AT TIME ZONE v_user_timezone)
                    AT TIME ZONE v_user_timezone) AT TIME ZONE 'UTC';

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

  SELECT jsonb_build_object(
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'broken',    COUNT(*) FILTER (WHERE status = 'broken'),
    'minutes',   COALESCE(SUM(duration_minutes) FILTER (WHERE status = 'completed'), 0),
    'xp',        COALESCE(SUM(xp_awarded) FILTER (WHERE status = 'completed'), 0)
  ) INTO v_month
  FROM public.focus_sessions
  WHERE user_id = v_user_id
    AND ended_at >= v_month_start AND ended_at <= v_today_end;

  SELECT jsonb_build_object(
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'broken',    COUNT(*) FILTER (WHERE status = 'broken'),
    'minutes',   COALESCE(SUM(duration_minutes) FILTER (WHERE status = 'completed'), 0),
    'xp',        COALESCE(SUM(xp_awarded) FILTER (WHERE status = 'completed'), 0)
  ) INTO v_year
  FROM public.focus_sessions
  WHERE user_id = v_user_id
    AND ended_at >= v_year_start AND ended_at <= v_today_end;

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

  SELECT EXISTS(
    SELECT 1 FROM public.focus_daily_reward_claims
    WHERE user_id = v_user_id AND claim_date = v_today_date
  ) INTO v_reward_claimed;

  RETURN jsonb_build_object(
    'species_counts', v_species_counts,
    'today', v_today,
    'week', v_week,
    'month', v_month,
    'year', v_year,
    'today_reward_claimed', v_reward_claimed,
    'period_starts', jsonb_build_object(
      'today', v_today_start AT TIME ZONE 'UTC',
      'week', v_week_start AT TIME ZONE 'UTC',
      'month', v_month_start AT TIME ZONE 'UTC',
      'year', v_year_start AT TIME ZONE 'UTC'
    ),
    'recent_sessions', v_recent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_focus_stats() TO authenticated;

COMMENT ON FUNCTION public.get_focus_stats IS 'Vault + Arena data in one call: species counts, today/week/month/year aggregates, today_reward_claimed, period boundaries, recent sessions (50, newest first)';
