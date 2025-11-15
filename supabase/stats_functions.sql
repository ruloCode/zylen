-- ===========================================================================
-- Stats RPC Functions for Zylen
-- ===========================================================================
-- These functions handle complex statistical queries and aggregations
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Function: get_user_stats
-- Description: Get comprehensive user statistics in a single query
-- Returns: JSONB with all user stats
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_completions INTEGER;
  v_active_days INTEGER;
  v_daily_average NUMERIC;
  v_longest_streak INTEGER;
  v_current_streak INTEGER;
  v_total_xp INTEGER;
  v_total_level INTEGER;
  v_days_since_joining INTEGER;
  v_top_area JSONB;
BEGIN
  -- Get total completions
  SELECT COUNT(*) INTO v_total_completions
  FROM public.habit_completions
  WHERE user_id = p_user_id;

  -- Get active days (distinct dates with completions)
  SELECT COUNT(DISTINCT DATE(completed_at)) INTO v_active_days
  FROM public.habit_completions
  WHERE user_id = p_user_id;

  -- Calculate daily average
  IF v_active_days > 0 THEN
    v_daily_average := ROUND((v_total_completions::NUMERIC / v_active_days::NUMERIC), 1);
  ELSE
    v_daily_average := 0;
  END IF;

  -- Get streak info
  SELECT current_streak, longest_streak INTO v_current_streak, v_longest_streak
  FROM public.streaks
  WHERE user_id = p_user_id;

  -- Get total XP and level from enabled life areas
  SELECT
    COALESCE(SUM(total_xp), 0),
    COALESCE(SUM(level), 0)
  INTO v_total_xp, v_total_level
  FROM public.life_areas
  WHERE user_id = p_user_id AND enabled = true;

  -- Get days since joining
  SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER INTO v_days_since_joining
  FROM public.profiles
  WHERE id = p_user_id;

  -- Get top life area (most XP)
  SELECT jsonb_build_object(
    'name', area_type,
    'xp', total_xp,
    'level', level
  ) INTO v_top_area
  FROM public.life_areas
  WHERE user_id = p_user_id AND enabled = true
  ORDER BY total_xp DESC
  LIMIT 1;

  -- Return all stats as JSONB
  RETURN jsonb_build_object(
    'total_completions', COALESCE(v_total_completions, 0),
    'active_days', COALESCE(v_active_days, 0),
    'daily_average', COALESCE(v_daily_average, 0),
    'longest_streak', COALESCE(v_longest_streak, 0),
    'current_streak', COALESCE(v_current_streak, 0),
    'total_xp', COALESCE(v_total_xp, 0),
    'total_level', COALESCE(v_total_level, 0),
    'days_since_joining', COALESCE(v_days_since_joining, 0),
    'top_life_area', v_top_area
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_stats(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Function: get_xp_distribution
-- Description: Get XP distribution across life areas with percentages
-- Returns: Array of JSONB with area_type, total_xp, and percentage
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_xp_distribution(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_xp INTEGER;
  v_result JSONB;
BEGIN
  -- Get total XP across all enabled areas
  SELECT COALESCE(SUM(total_xp), 0) INTO v_total_xp
  FROM public.life_areas
  WHERE user_id = p_user_id AND enabled = true;

  -- If no XP, return empty array
  IF v_total_xp = 0 THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Get distribution with percentages
  SELECT jsonb_agg(
    jsonb_build_object(
      'area_type', area_type,
      'total_xp', total_xp,
      'percentage', ROUND((total_xp::NUMERIC / v_total_xp::NUMERIC * 100), 1)
    )
  ) INTO v_result
  FROM public.life_areas
  WHERE user_id = p_user_id AND enabled = true
  ORDER BY total_xp DESC;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_xp_distribution(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Function: get_habit_completion_trend
-- Description: Get daily habit completion counts for the last N days
-- Parameters:
--   p_user_id: User ID
--   p_days: Number of days to look back (default: 30)
-- Returns: Array of JSONB with date and completions count
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_habit_completion_trend(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_start_date DATE;
BEGIN
  -- Calculate start date
  v_start_date := CURRENT_DATE - (p_days || ' days')::INTERVAL;

  -- Generate series of dates and count completions for each
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', day_date,
      'completions', COALESCE(completion_count, 0)
    ) ORDER BY day_date
  ) INTO v_result
  FROM (
    SELECT
      d.day_date::DATE,
      COUNT(hc.id) as completion_count
    FROM (
      -- Generate series of dates
      SELECT generate_series(
        v_start_date,
        CURRENT_DATE,
        '1 day'::INTERVAL
      )::DATE as day_date
    ) d
    LEFT JOIN public.habit_completions hc ON
      DATE(hc.completed_at) = d.day_date
      AND hc.user_id = p_user_id
    GROUP BY d.day_date
    ORDER BY d.day_date
  ) trend_data;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_habit_completion_trend(UUID, INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------
COMMENT ON FUNCTION public.get_user_stats IS 'Get comprehensive user statistics including completions, streaks, XP, and top life area';
COMMENT ON FUNCTION public.get_xp_distribution IS 'Get XP distribution across life areas with percentages';
COMMENT ON FUNCTION public.get_habit_completion_trend IS 'Get daily habit completion counts for the last N days';
