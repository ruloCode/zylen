-- ============================================================================
-- ACHIEVEMENTS SYSTEM TABLES
-- Migration: 20250117000002
-- ============================================================================
-- Creates tables for the achievement/badge system

-- Table: achievements
-- Defines all available achievements in the system
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE, -- Unique identifier like 'week_warrior', 'consistency_king'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL, -- Lucide icon name
  category TEXT NOT NULL, -- 'streak', 'habit', 'xp', 'social', 'special'
  tier TEXT NOT NULL DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  requirement_type TEXT NOT NULL, -- 'streak_days', 'habit_completions', 'total_xp', 'friends_count', etc.
  requirement_value INTEGER NOT NULL, -- The threshold to unlock
  xp_reward INTEGER NOT NULL DEFAULT 0, -- XP awarded when unlocked
  points_reward INTEGER NOT NULL DEFAULT 0, -- Points awarded when unlocked
  is_hidden BOOLEAN NOT NULL DEFAULT false, -- Hidden until unlocked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: user_achievements
-- Tracks which achievements users have unlocked
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  progress INTEGER DEFAULT 0, -- Current progress toward requirement (0-requirement_value)

  -- Ensure one achievement per user
  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public readable)
CREATE POLICY "Achievements are viewable by everyone"
  ON public.achievements FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON public.user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_tier ON public.achievements(tier);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON public.user_achievements(unlocked_at);

-- ============================================================================
-- SEED DATA: Default Achievements
-- ============================================================================

INSERT INTO public.achievements (key, name, description, icon_name, category, tier, requirement_type, requirement_value, xp_reward, points_reward) VALUES
  -- Streak Achievements
  ('week_warrior', 'Week Warrior', 'Complete 7 days in a row', 'Zap', 'streak', 'bronze', 'current_streak', 7, 50, 25),
  ('two_week_titan', 'Two Week Titan', 'Complete 14 days in a row', 'Flame', 'streak', 'silver', 'current_streak', 14, 100, 50),
  ('month_master', 'Month Master', 'Complete 30 days in a row', 'Crown', 'streak', 'gold', 'current_streak', 30, 200, 100),
  ('unstoppable', 'Unstoppable', 'Complete 100 days in a row', 'Trophy', 'streak', 'platinum', 'current_streak', 100, 500, 250),

  -- Habit Completion Achievements
  ('habit_hero', 'Habit Hero', 'Complete 50 total habits', 'Target', 'habit', 'bronze', 'total_habit_completions', 50, 50, 25),
  ('consistency_king', 'Consistency King', 'Complete 200 total habits', 'CheckCheck', 'habit', 'silver', 'total_habit_completions', 200, 150, 75),
  ('routine_legend', 'Routine Legend', 'Complete 500 total habits', 'Award', 'habit', 'gold', 'total_habit_completions', 500, 300, 150),

  -- XP Achievements
  ('xp_novice', 'XP Novice', 'Earn 1,000 total XP', 'Star', 'xp', 'bronze', 'total_xp', 1000, 50, 25),
  ('xp_expert', 'XP Expert', 'Earn 5,000 total XP', 'Stars', 'xp', 'silver', 'total_xp', 5000, 150, 75),
  ('xp_master', 'XP Master', 'Earn 10,000 total XP', 'Sparkles', 'xp', 'gold', 'total_xp', 10000, 300, 150),

  -- Social Achievements
  ('social_butterfly', 'Social Butterfly', 'Add 5 friends', 'Users', 'social', 'bronze', 'friends_count', 5, 50, 25),
  ('network_builder', 'Network Builder', 'Add 10 friends', 'UsersRound', 'social', 'silver', 'friends_count', 10, 100, 50),

  -- Special Achievements
  ('early_bird', 'Early Bird', 'Complete a habit before 8 AM', 'Sunrise', 'special', 'bronze', 'early_completion', 1, 25, 15),
  ('night_owl', 'Night Owl', 'Complete a habit after 10 PM', 'Moon', 'special', 'bronze', 'late_completion', 1, 25, 15),
  ('perfect_day', 'Perfect Day', 'Complete all your habits in a single day', 'CheckCircle2', 'special', 'silver', 'perfect_day', 1, 100, 50),
  ('comeback', 'Comeback', 'Complete the 30-day Root Habit challenge', 'Sunrise', 'special', 'gold', 'root_habit_complete', 1, 250, 125)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTION: Check and Unlock Achievements
-- ============================================================================
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
        SELECT current_streak INTO user_progress
        FROM public.streaks
        WHERE user_id = p_user_id;

      WHEN 'total_habit_completions' THEN
        SELECT COUNT(*) INTO user_progress
        FROM public.habit_completions
        WHERE user_id = p_user_id;

      WHEN 'total_xp' THEN
        SELECT total_xp_earned INTO user_progress
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

      ELSE
        user_progress := 0;
    END CASE;

    -- If requirement is met, unlock the achievement
    IF user_progress >= achievement_record.requirement_value THEN
      INSERT INTO public.user_achievements (user_id, achievement_id, progress)
      VALUES (p_user_id, achievement_record.id, user_progress)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;

      -- Award XP and points
      UPDATE public.profiles
      SET
        total_xp_earned = total_xp_earned + achievement_record.xp_reward,
        points = points + achievement_record.points_reward
      WHERE id = p_user_id;

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
    ORDER BY ua.unlocked_at DESC
    LIMIT v_unlocked_count
  ) a;

  RETURN QUERY SELECT v_unlocked_count, COALESCE(v_unlocked_achievements, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_and_unlock_achievements(UUID) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
