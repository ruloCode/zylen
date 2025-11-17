-- ===========================================================================
-- Habits RPC Functions for Zylen
-- ===========================================================================
-- These functions handle habit completion logic atomically
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Function: complete_habit
-- Description: Atomically complete a habit for today
-- This function performs ALL updates in a single transaction:
-- 1. Check if already completed today
-- 2. Insert habit_completion record
-- 3. Update user points
-- 4. Update user total_xp_earned
-- 5. Update life area total_xp and level
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_habit(p_habit_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_habit RECORD;
  v_completion_id UUID;
  v_new_life_area_xp INTEGER;
  v_new_life_area_level INTEGER;
  v_today_start TIMESTAMP;
  v_today_end TIMESTAMP;
  v_user_timezone TEXT;
  v_today_date DATE;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user's timezone from profile
  SELECT timezone INTO v_user_timezone
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_timezone IS NULL THEN
    v_user_timezone := 'America/Bogota'; -- Default fallback
  END IF;

  -- Get today's date range in user's timezone
  -- 1. Convert current UTC time to user's timezone and extract the date
  v_today_date := (NOW() AT TIME ZONE v_user_timezone)::date;

  -- 2. Convert that date to midnight timestamp in user's timezone, then to UTC
  v_today_start := (v_today_date::timestamp AT TIME ZONE v_user_timezone) AT TIME ZONE 'UTC';
  v_today_end := v_today_start + INTERVAL '1 day' - INTERVAL '1 second';

  -- Get habit details and verify ownership
  SELECT * INTO v_habit
  FROM public.habits
  WHERE id = p_habit_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Habit not found';
  END IF;

  -- Check if already completed today
  IF EXISTS (
    SELECT 1 FROM public.habit_completions
    WHERE habit_id = p_habit_id
    AND user_id = v_user_id
    AND completed_at >= v_today_start
    AND completed_at <= v_today_end
  ) THEN
    RAISE EXCEPTION 'Habit already completed today';
  END IF;

  -- Insert completion record
  INSERT INTO public.habit_completions (
    user_id,
    habit_id,
    xp_earned,
    points_earned
  )
  VALUES (
    v_user_id,
    p_habit_id,
    v_habit.xp,
    v_habit.points
  )
  RETURNING id INTO v_completion_id;

  -- Update user points
  UPDATE public.profiles
  SET points = points + v_habit.points
  WHERE id = v_user_id;

  -- Update user total XP and level
  UPDATE public.profiles
  SET total_xp_earned = total_xp_earned + v_habit.xp
  WHERE id = v_user_id;

  -- Recalculate user level using shared function
  -- This ensures consistency with update_user_xp and other functions
  UPDATE public.profiles
  SET level = public.calculate_user_level(total_xp_earned)
  WHERE id = v_user_id;

  -- Update life area XP
  UPDATE public.life_areas
  SET total_xp = total_xp + v_habit.xp
  WHERE id = v_habit.life_area_id
  RETURNING total_xp INTO v_new_life_area_xp;

  -- Recalculate life area level using shared function
  -- This ensures consistency across all life area level calculations
  v_new_life_area_level := public.calculate_life_area_level(v_new_life_area_xp);

  UPDATE public.life_areas
  SET level = v_new_life_area_level
  WHERE id = v_habit.life_area_id;

  -- Return completion details
  RETURN jsonb_build_object(
    'completion_id', v_completion_id,
    'xp_earned', v_habit.xp,
    'points_earned', v_habit.points,
    'life_area_leveled_up', v_new_life_area_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.complete_habit(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Function: uncomplete_habit
-- Description: Atomically remove today's habit completion
-- This function reverts ALL changes made by complete_habit:
-- 1. Find today's completion
-- 2. Delete completion record
-- 3. Revert user points
-- 4. Revert user total_xp_earned
-- 5. Revert life area total_xp and level
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.uncomplete_habit(p_habit_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_completion RECORD;
  v_habit RECORD;
  v_new_life_area_xp INTEGER;
  v_new_life_area_level INTEGER;
  v_today_start TIMESTAMP;
  v_today_end TIMESTAMP;
  v_user_timezone TEXT;
  v_today_date DATE;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user's timezone from profile
  SELECT timezone INTO v_user_timezone
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_timezone IS NULL THEN
    v_user_timezone := 'America/Bogota'; -- Default fallback
  END IF;

  -- Get today's date range in user's timezone
  -- 1. Convert current UTC time to user's timezone and extract the date
  v_today_date := (NOW() AT TIME ZONE v_user_timezone)::date;

  -- 2. Convert that date to midnight timestamp in user's timezone, then to UTC
  v_today_start := (v_today_date::timestamp AT TIME ZONE v_user_timezone) AT TIME ZONE 'UTC';
  v_today_end := v_today_start + INTERVAL '1 day' - INTERVAL '1 second';

  -- Get habit details
  SELECT * INTO v_habit
  FROM public.habits
  WHERE id = p_habit_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Habit not found';
  END IF;

  -- Find today's completion
  SELECT * INTO v_completion
  FROM public.habit_completions
  WHERE habit_id = p_habit_id
  AND user_id = v_user_id
  AND completed_at >= v_today_start
  AND completed_at <= v_today_end;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Completion not found for today';
  END IF;

  -- Delete completion record
  DELETE FROM public.habit_completions
  WHERE id = v_completion.id;

  -- Revert user points (ensure not below 0)
  UPDATE public.profiles
  SET points = GREATEST(0, points - v_completion.points_earned)
  WHERE id = v_user_id;

  -- Revert user total XP (ensure not below 0)
  UPDATE public.profiles
  SET total_xp_earned = GREATEST(0, total_xp_earned - v_completion.xp_earned)
  WHERE id = v_user_id;

  -- Recalculate user level using shared function
  -- This ensures consistency with update_user_xp and other functions
  UPDATE public.profiles
  SET level = public.calculate_user_level(total_xp_earned)
  WHERE id = v_user_id;

  -- Revert life area XP (ensure not below 0)
  UPDATE public.life_areas
  SET total_xp = GREATEST(0, total_xp - v_completion.xp_earned)
  WHERE id = v_habit.life_area_id
  RETURNING total_xp INTO v_new_life_area_xp;

  -- Recalculate life area level using shared function
  -- This ensures consistency across all life area level calculations
  v_new_life_area_level := public.calculate_life_area_level(v_new_life_area_xp);

  UPDATE public.life_areas
  SET level = v_new_life_area_level
  WHERE id = v_habit.life_area_id;

  -- Return revert details
  RETURN jsonb_build_object(
    'completion_id', v_completion.id,
    'xp_reverted', v_completion.xp_earned,
    'points_reverted', v_completion.points_earned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.uncomplete_habit(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------
COMMENT ON FUNCTION public.complete_habit IS 'Atomically complete a habit and update all related data (points, XP, life area level)';
COMMENT ON FUNCTION public.uncomplete_habit IS 'Atomically remove today''s habit completion and revert all changes';
