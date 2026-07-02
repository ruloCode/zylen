-- ===========================================================================
-- complete_habit v2 / uncomplete_habit v2
-- ===========================================================================
-- Changes vs v1:
--   * complete_habit(p_habit_id, p_value DEFAULT NULL): persists the logged
--     value for measurable habits.
--   * Streak bonus applied SERVER-SIDE: xp * (1 + min(streak, 20) * 0.05)
--     -> caps at 2.0x after a 20-day streak (mirrors STREAK_CONFIG.maxStreakBonus).
--   * Soft daily XP cap (anti-farming): full XP until 200 awarded-XP/day,
--     50% between 200-300, 20% beyond 300 (mirrors XP_CONFIG.dailyXP* consts).
--   * The XP actually awarded is stored in habit_completions.xp_earned, so
--     uncomplete_habit reverts the exact amount with no extra logic.
--   * Streak is updated INSIDE the RPC via refresh_user_streak (no extra
--     client round-trip, no corrupted last_seven_days).
--   * Enriched JSONB return so the client can sync its store optimistically
--     without refetching: xp/points awarded, new totals, level-up flags,
--     streak state and life-area state.
-- Idempotent: drops the old (uuid) overload, CREATE OR REPLACE the rest.
-- ===========================================================================

-- Drop the old single-arg overload so RPC name resolution is unambiguous
DROP FUNCTION IF EXISTS public.complete_habit(UUID);

CREATE OR REPLACE FUNCTION public.complete_habit(
  p_habit_id UUID,
  p_value NUMERIC DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_habit RECORD;
  v_completion_id UUID;
  v_user_timezone TEXT;
  v_today_date DATE;
  v_today_start TIMESTAMP;
  v_today_end TIMESTAMP;

  -- Progression
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_new_total_xp INTEGER;
  v_new_points INTEGER;
  v_streak_before INTEGER := 0;
  v_prospective_streak INTEGER;
  v_multiplier NUMERIC;
  v_today_xp INTEGER;
  v_damping NUMERIC := 1.0;
  v_xp_raw INTEGER;
  v_xp_awarded INTEGER;
  v_capped BOOLEAN := false;

  -- Life area
  v_old_area_level INTEGER;
  v_new_life_area_xp INTEGER;
  v_new_life_area_level INTEGER;

  v_streak JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
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

  -- Habit lookup + ownership check
  SELECT * INTO v_habit
  FROM public.habits
  WHERE id = p_habit_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Habit not found';
  END IF;

  -- Already completed today?
  IF EXISTS (
    SELECT 1 FROM public.habit_completions
    WHERE habit_id = p_habit_id
      AND user_id = v_user_id
      AND completed_at >= v_today_start
      AND completed_at <= v_today_end
  ) THEN
    RAISE EXCEPTION 'Habit already completed today';
  END IF;

  -- -------------------------------------------------------------------------
  -- Streak bonus: use the streak as it will be INCLUDING today's completion
  -- -------------------------------------------------------------------------
  SELECT COALESCE(s.current_streak, 0),
         CASE
           WHEN s.last_completion_date = v_today_date THEN COALESCE(s.current_streak, 0)
           WHEN s.last_completion_date = v_today_date - 1 THEN COALESCE(s.current_streak, 0) + 1
           ELSE 1
         END
  INTO v_streak_before, v_prospective_streak
  FROM public.streaks s WHERE s.user_id = v_user_id;

  IF v_prospective_streak IS NULL THEN
    v_prospective_streak := 1;
  END IF;

  -- +5% XP per streak day, capped at 2.0x (20 days)
  v_multiplier := 1 + LEAST(v_prospective_streak, 20) * 0.05;

  -- -------------------------------------------------------------------------
  -- Soft daily XP cap: full rate < 200 awarded XP today, 50% < 300, 20% after
  -- -------------------------------------------------------------------------
  SELECT COALESCE(SUM(xp_earned), 0) INTO v_today_xp
  FROM public.habit_completions
  WHERE user_id = v_user_id
    AND completed_at >= v_today_start
    AND completed_at <= v_today_end;

  IF v_today_xp >= 300 THEN
    v_damping := 0.2;
  ELSIF v_today_xp >= 200 THEN
    v_damping := 0.5;
  END IF;

  v_xp_raw := ROUND(v_habit.xp * v_multiplier);
  v_xp_awarded := GREATEST(1, ROUND(v_xp_raw * v_damping));
  v_capped := v_damping < 1.0;

  -- -------------------------------------------------------------------------
  -- Insert completion (stores the XP actually awarded + measurable value)
  -- -------------------------------------------------------------------------
  INSERT INTO public.habit_completions (user_id, habit_id, xp_earned, points_earned, value)
  VALUES (v_user_id, p_habit_id, v_xp_awarded, v_habit.points, p_value)
  RETURNING id INTO v_completion_id;

  -- -------------------------------------------------------------------------
  -- Profile: points, XP and level in one pass
  -- -------------------------------------------------------------------------
  UPDATE public.profiles
  SET points = points + v_habit.points,
      total_xp_earned = total_xp_earned + v_xp_awarded
  WHERE id = v_user_id
  RETURNING points, total_xp_earned INTO v_new_points, v_new_total_xp;

  v_new_level := public.calculate_user_level(v_new_total_xp);

  UPDATE public.profiles
  SET level = v_new_level
  WHERE id = v_user_id;

  -- -------------------------------------------------------------------------
  -- Life area XP + level
  -- -------------------------------------------------------------------------
  SELECT level INTO v_old_area_level
  FROM public.life_areas WHERE id = v_habit.life_area_id;

  UPDATE public.life_areas
  SET total_xp = total_xp + v_xp_awarded
  WHERE id = v_habit.life_area_id
  RETURNING total_xp INTO v_new_life_area_xp;

  v_new_life_area_level := public.calculate_life_area_level(v_new_life_area_xp);

  UPDATE public.life_areas
  SET level = v_new_life_area_level
  WHERE id = v_habit.life_area_id;

  -- -------------------------------------------------------------------------
  -- Streak: recompute from completions (self-healing, includes today)
  -- -------------------------------------------------------------------------
  v_streak := public.refresh_user_streak(v_user_id);

  RETURN jsonb_build_object(
    'completion_id', v_completion_id,
    'xp_base', v_habit.xp,
    'streak_multiplier', v_multiplier,
    'xp_awarded', v_xp_awarded,
    'xp_earned', v_xp_awarded,            -- backward-compat alias
    'capped', v_capped,
    'points_awarded', v_habit.points,
    'points_earned', v_habit.points,      -- backward-compat alias
    'new_total_xp', v_new_total_xp,
    'new_level', v_new_level,
    'leveled_up', v_new_level > v_old_level,
    'new_points', v_new_points,
    'streak', v_streak,
    'life_area', jsonb_build_object(
      'id', v_habit.life_area_id,
      'total_xp', v_new_life_area_xp,
      'level', v_new_life_area_level,
      'leveled_up', v_new_life_area_level > COALESCE(v_old_area_level, v_new_life_area_level)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.complete_habit(UUID, NUMERIC) TO authenticated;

-- ---------------------------------------------------------------------------
-- uncomplete_habit v2: same revert as v1 + streak refresh + enriched return
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.uncomplete_habit(p_habit_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_completion RECORD;
  v_habit RECORD;
  v_user_timezone TEXT;
  v_today_date DATE;
  v_today_start TIMESTAMP;
  v_today_end TIMESTAMP;
  v_new_total_xp INTEGER;
  v_new_points INTEGER;
  v_new_level INTEGER;
  v_new_life_area_xp INTEGER;
  v_new_life_area_level INTEGER;
  v_streak JSONB;
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

  SELECT * INTO v_habit
  FROM public.habits
  WHERE id = p_habit_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Habit not found';
  END IF;

  SELECT * INTO v_completion
  FROM public.habit_completions
  WHERE habit_id = p_habit_id
    AND user_id = v_user_id
    AND completed_at >= v_today_start
    AND completed_at <= v_today_end;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Completion not found for today';
  END IF;

  DELETE FROM public.habit_completions WHERE id = v_completion.id;

  UPDATE public.profiles
  SET points = GREATEST(0, points - v_completion.points_earned),
      total_xp_earned = GREATEST(0, total_xp_earned - v_completion.xp_earned)
  WHERE id = v_user_id
  RETURNING points, total_xp_earned INTO v_new_points, v_new_total_xp;

  v_new_level := public.calculate_user_level(v_new_total_xp);

  UPDATE public.profiles
  SET level = v_new_level
  WHERE id = v_user_id;

  UPDATE public.life_areas
  SET total_xp = GREATEST(0, total_xp - v_completion.xp_earned)
  WHERE id = v_habit.life_area_id
  RETURNING total_xp INTO v_new_life_area_xp;

  v_new_life_area_level := public.calculate_life_area_level(v_new_life_area_xp);

  UPDATE public.life_areas
  SET level = v_new_life_area_level
  WHERE id = v_habit.life_area_id;

  v_streak := public.refresh_user_streak(v_user_id);

  RETURN jsonb_build_object(
    'completion_id', v_completion.id,
    'xp_reverted', v_completion.xp_earned,
    'points_reverted', v_completion.points_earned,
    'new_total_xp', v_new_total_xp,
    'new_level', v_new_level,
    'new_points', v_new_points,
    'streak', v_streak,
    'life_area', jsonb_build_object(
      'id', v_habit.life_area_id,
      'total_xp', v_new_life_area_xp,
      'level', v_new_life_area_level
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.uncomplete_habit(UUID) TO authenticated;

COMMENT ON FUNCTION public.complete_habit IS 'Atomically complete a habit: streak bonus + soft daily XP cap + measurable value + streak refresh; returns full sync payload';
COMMENT ON FUNCTION public.uncomplete_habit IS 'Atomically revert today''s completion (exact awarded XP) + streak refresh; returns full sync payload';
