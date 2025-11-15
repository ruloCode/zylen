-- ===========================================================================
-- Supabase RPC Functions for Zylen
-- ===========================================================================
-- This file contains PostgreSQL functions that can be called from the client
-- using supabase.rpc('function_name', { params })
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Function: update_user_points
-- Description: Atomically update user points (add or subtract)
-- Parameters:
--   p_user_id: UUID of the user
--   p_delta: Amount to add (positive) or subtract (negative)
-- Returns: JSON object with new_points
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_user_points(
  p_user_id UUID,
  p_delta INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_new_points INTEGER;
BEGIN
  -- Update points, ensuring it never goes below 0
  UPDATE public.profiles
  SET points = GREATEST(0, points + p_delta)
  WHERE id = p_user_id
  RETURNING points INTO v_new_points;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN jsonb_build_object('new_points', v_new_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_points(UUID, INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- Function: update_user_xp
-- Description: Atomically update user XP and recalculate level
-- Parameters:
--   p_user_id: UUID of the user
--   p_xp_delta: Amount of XP to add (positive) or subtract (negative)
-- Returns: JSON object with new_total_xp and new_level
-- Note: Level calculation uses shared function calculate_user_level()
--       Base XP: 350, Multiplier: 1.12 (moderate progression)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_user_xp(
  p_user_id UUID,
  p_xp_delta INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_new_total_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Update XP, ensuring it never goes below 0
  UPDATE public.profiles
  SET total_xp_earned = GREATEST(0, total_xp_earned + p_xp_delta)
  WHERE id = p_user_id
  RETURNING total_xp_earned INTO v_new_total_xp;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calculate new level using shared function
  -- This ensures consistency across all level calculations
  -- Base XP: 350, Multiplier: 1.12 (moderate progression)
  v_new_level := public.calculate_user_level(v_new_total_xp);

  -- Update level
  UPDATE public.profiles
  SET level = v_new_level
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'new_total_xp', v_new_total_xp,
    'new_level', v_new_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_xp(UUID, INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- Function: get_user_stats (placeholder for now, will be expanded in StatsService)
-- Description: Get comprehensive user statistics
-- Parameters:
--   p_user_id: UUID of the user
-- Returns: JSON object with various stats
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
  v_total_completions INTEGER;
  v_longest_streak INTEGER;
  v_current_streak INTEGER;
  v_total_habits INTEGER;
  v_total_xp INTEGER;
  v_total_points INTEGER;
  v_total_spent INTEGER;
BEGIN
  -- Total habit completions (all time)
  SELECT COUNT(*) INTO v_total_completions
  FROM public.habit_completions
  WHERE user_id = p_user_id;

  -- Streaks
  SELECT
    COALESCE(longest_streak, 0),
    COALESCE(current_streak, 0)
  INTO v_longest_streak, v_current_streak
  FROM public.streaks
  WHERE user_id = p_user_id;

  -- Total habits
  SELECT COUNT(*) INTO v_total_habits
  FROM public.habits
  WHERE user_id = p_user_id;

  -- Total XP and points
  SELECT
    COALESCE(total_xp_earned, 0),
    COALESCE(points, 0)
  INTO v_total_xp, v_total_points
  FROM public.profiles
  WHERE id = p_user_id;

  -- Total points spent
  SELECT COALESCE(SUM(cost), 0) INTO v_total_spent
  FROM public.purchases
  WHERE user_id = p_user_id;

  -- Build stats object
  v_stats := jsonb_build_object(
    'totalHabitsCompleted', v_total_completions,
    'longestStreak', v_longest_streak,
    'currentStreak', v_current_streak,
    'totalHabits', v_total_habits,
    'totalXP', v_total_xp,
    'currentPoints', v_total_points,
    'totalPointsSpent', v_total_spent
  );

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_stats(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Comment on functions for documentation
-- ---------------------------------------------------------------------------
COMMENT ON FUNCTION public.update_user_points IS 'Atomically update user points, ensuring minimum value of 0';
COMMENT ON FUNCTION public.update_user_xp IS 'Atomically update user XP and recalculate level based on formula';
COMMENT ON FUNCTION public.get_user_stats IS 'Get comprehensive user statistics for dashboard and profile pages';
