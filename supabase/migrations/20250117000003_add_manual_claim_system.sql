-- ============================================================================
-- ACHIEVEMENTS MANUAL CLAIM SYSTEM
-- Migration: 20250117000003
-- ============================================================================
-- Adds manual claim functionality for achievements
-- Changes automatic reward application to manual claim system
-- ============================================================================

-- Add claimed_at column to user_achievements
-- NULL = unlocked but not claimed, TIMESTAMP = already claimed
ALTER TABLE public.user_achievements
ADD COLUMN claimed_at TIMESTAMP WITH TIME ZONE;

-- Create index for filtering claimed/unclaimed achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_claimed_at ON public.user_achievements(claimed_at);

-- ============================================================================
-- MODIFIED FUNCTION: Check and Unlock Achievements (WITHOUT auto rewards)
-- ============================================================================
-- Now only marks achievements as unlocked, does NOT apply rewards
CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements(p_user_id UUID)
RETURNS TABLE (
  newly_unlocked INTEGER,
  achievements_unlocked JSON
) AS $$
DECLARE
  v_unlocked_count INTEGER := 0;
  v_unlocked_achievements JSON;
  achievement_record RECORD;
  user_progress INTEGER;
BEGIN
  -- Loop through all achievements
  FOR achievement_record IN
    SELECT a.*
    FROM public.achievements a
    LEFT JOIN public.user_achievements ua
      ON ua.achievement_id = a.id AND ua.user_id = p_user_id
    WHERE ua.id IS NULL -- Only check achievements not yet unlocked
  LOOP
    user_progress := 0;

    -- Calculate user's progress for this achievement type
    CASE achievement_record.requirement_type
      WHEN 'current_streak' THEN
        SELECT COALESCE(current_streak, 0) INTO user_progress
        FROM public.streaks
        WHERE user_id = p_user_id;

      WHEN 'total_habit_completions' THEN
        SELECT COUNT(*) INTO user_progress
        FROM public.habit_completions
        WHERE user_id = p_user_id;

      WHEN 'total_xp' THEN
        SELECT COALESCE(total_xp_earned, 0) INTO user_progress
        FROM public.profiles
        WHERE id = p_user_id;

      WHEN 'friends_count' THEN
        SELECT COUNT(*) INTO user_progress
        FROM public.friendships
        WHERE (user_id = p_user_id OR friend_id = p_user_id) AND status = 'accepted';

      WHEN 'root_habit_complete' THEN
        SELECT COUNT(*) INTO user_progress
        FROM public.root_habit_checkins
        WHERE user_id = p_user_id;
        -- Complete = 30 check-ins
        user_progress := CASE WHEN user_progress >= 30 THEN 1 ELSE 0 END;

      WHEN 'early_completion' THEN
        SELECT COUNT(*) INTO user_progress
        FROM public.habit_completions
        WHERE user_id = p_user_id
          AND EXTRACT(HOUR FROM completed_at) < 8;

      WHEN 'late_completion' THEN
        SELECT COUNT(*) INTO user_progress
        FROM public.habit_completions
        WHERE user_id = p_user_id
          AND EXTRACT(HOUR FROM completed_at) >= 22;

      WHEN 'perfect_day' THEN
        -- Check if there's a day where all habits were completed
        SELECT COUNT(DISTINCT DATE(hc.completed_at)) INTO user_progress
        FROM public.habit_completions hc
        WHERE hc.user_id = p_user_id
          AND NOT EXISTS (
            SELECT 1
            FROM public.habits h
            WHERE h.user_id = p_user_id
              AND h.is_archived = false
              AND NOT EXISTS (
                SELECT 1
                FROM public.habit_completions hc2
                WHERE hc2.habit_id = h.id
                  AND DATE(hc2.completed_at) = DATE(hc.completed_at)
              )
          );

      ELSE
        user_progress := 0;
    END CASE;

    -- If requirement is met, unlock the achievement (but DON'T apply rewards yet)
    IF user_progress >= achievement_record.requirement_value THEN
      INSERT INTO public.user_achievements (user_id, achievement_id, progress, claimed_at)
      VALUES (p_user_id, achievement_record.id, user_progress, NULL)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;

      -- Note: NO UPDATE to profiles table here - rewards applied on manual claim

      v_unlocked_count := v_unlocked_count + 1;
    END IF;
  END LOOP;

  -- Get list of newly unlocked achievements
  SELECT json_agg(row_to_json(a))
  INTO v_unlocked_achievements
  FROM (
    SELECT a.key, a.name, a.xp_reward, a.points_reward
    FROM public.user_achievements ua
    JOIN public.achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = p_user_id
      AND ua.claimed_at IS NULL -- Only return unclaimed achievements
    ORDER BY ua.unlocked_at DESC
    LIMIT v_unlocked_count
  ) a;

  RETURN QUERY SELECT v_unlocked_count, COALESCE(v_unlocked_achievements, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NEW FUNCTION: Claim Achievement Reward
-- ============================================================================
-- Manually claims an unlocked achievement and applies rewards
CREATE OR REPLACE FUNCTION public.claim_achievement_reward(
  p_user_id UUID,
  p_achievement_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_achievement RECORD;
  v_user_achievement RECORD;
  v_result JSON;
BEGIN
  -- Get achievement details
  SELECT * INTO v_achievement
  FROM public.achievements
  WHERE id = p_achievement_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Achievement not found');
  END IF;

  -- Check if user has unlocked this achievement
  SELECT * INTO v_user_achievement
  FROM public.user_achievements
  WHERE user_id = p_user_id AND achievement_id = p_achievement_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Achievement not unlocked');
  END IF;

  -- Check if already claimed
  IF v_user_achievement.claimed_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Achievement already claimed');
  END IF;

  -- Mark as claimed
  UPDATE public.user_achievements
  SET claimed_at = timezone('utc'::text, now())
  WHERE user_id = p_user_id AND achievement_id = p_achievement_id;

  -- Apply rewards to user profile
  UPDATE public.profiles
  SET
    total_xp_earned = total_xp_earned + v_achievement.xp_reward,
    points = points + v_achievement.points_reward
  WHERE id = p_user_id;

  -- Return success with reward details
  v_result := json_build_object(
    'success', true,
    'achievement_key', v_achievement.key,
    'achievement_name', v_achievement.name,
    'xp_reward', v_achievement.xp_reward,
    'points_reward', v_achievement.points_reward
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.claim_achievement_reward(UUID, UUID) TO authenticated;

-- ============================================================================
-- HELPER FUNCTION: Get Achievement Progress
-- ============================================================================
-- Returns current progress for all achievements for a user
CREATE OR REPLACE FUNCTION public.get_achievements_with_progress(p_user_id UUID)
RETURNS TABLE (
  achievement_id UUID,
  key TEXT,
  name TEXT,
  description TEXT,
  icon_name TEXT,
  category TEXT,
  tier TEXT,
  requirement_type TEXT,
  requirement_value INTEGER,
  xp_reward INTEGER,
  points_reward INTEGER,
  is_hidden BOOLEAN,
  current_progress INTEGER,
  is_unlocked BOOLEAN,
  is_claimed BOOLEAN,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS achievement_id,
    a.key,
    a.name,
    a.description,
    a.icon_name,
    a.category,
    a.tier,
    a.requirement_type,
    a.requirement_value,
    a.xp_reward,
    a.points_reward,
    a.is_hidden,
    -- Calculate current progress based on requirement type
    CASE a.requirement_type
      WHEN 'current_streak' THEN
        COALESCE((SELECT current_streak FROM public.streaks WHERE user_id = p_user_id), 0)
      WHEN 'total_habit_completions' THEN
        (SELECT COUNT(*)::INTEGER FROM public.habit_completions WHERE user_id = p_user_id)
      WHEN 'total_xp' THEN
        COALESCE((SELECT total_xp_earned FROM public.profiles WHERE id = p_user_id), 0)
      WHEN 'friends_count' THEN
        (SELECT COUNT(*)::INTEGER FROM public.friendships WHERE (user_id = p_user_id OR friend_id = p_user_id) AND status = 'accepted')
      WHEN 'root_habit_complete' THEN
        LEAST((SELECT COUNT(*)::INTEGER FROM public.root_habit_checkins WHERE user_id = p_user_id), 30)
      WHEN 'early_completion' THEN
        (SELECT COUNT(*)::INTEGER FROM public.habit_completions WHERE user_id = p_user_id AND EXTRACT(HOUR FROM completed_at) < 8)
      WHEN 'late_completion' THEN
        (SELECT COUNT(*)::INTEGER FROM public.habit_completions WHERE user_id = p_user_id AND EXTRACT(HOUR FROM completed_at) >= 22)
      WHEN 'perfect_day' THEN
        0 -- TODO: Implement perfect day calculation
      ELSE
        0
    END AS current_progress,
    ua.id IS NOT NULL AS is_unlocked,
    ua.claimed_at IS NOT NULL AS is_claimed,
    ua.unlocked_at,
    ua.claimed_at
  FROM public.achievements a
  LEFT JOIN public.user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = p_user_id
  ORDER BY
    CASE WHEN ua.claimed_at IS NULL AND ua.id IS NOT NULL THEN 1 ELSE 2 END, -- Available first
    CASE WHEN ua.claimed_at IS NOT NULL THEN 1 ELSE 2 END, -- Then claimed
    a.category,
    a.requirement_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_achievements_with_progress(UUID) TO authenticated;

-- ============================================================================
-- DATA MIGRATION: Set existing achievements as claimed
-- ============================================================================
-- All previously unlocked achievements should be marked as claimed
UPDATE public.user_achievements
SET claimed_at = unlocked_at
WHERE claimed_at IS NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
