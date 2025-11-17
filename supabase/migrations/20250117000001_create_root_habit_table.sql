-- ============================================================================
-- ROOT HABIT (30-DAY CHALLENGE) TABLE
-- Migration: 20250117000001
-- ============================================================================
-- Creates table to track the 30-day root habit challenge check-ins

-- Table: root_habit_checkins
-- Tracks daily check-ins for the 30-day challenge
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.root_habit_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 30),
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 20,

  -- Ensure one check-in per day per user
  CONSTRAINT unique_user_day UNIQUE (user_id, day_number)
);

-- Enable Row Level Security
ALTER TABLE public.root_habit_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own root habit check-ins"
  ON public.root_habit_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own root habit check-ins"
  ON public.root_habit_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own root habit check-ins"
  ON public.root_habit_checkins FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_root_habit_user_id ON public.root_habit_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_root_habit_checked_in_at ON public.root_habit_checkins(checked_in_at);

-- ============================================================================
-- HELPER FUNCTION: Get Root Habit Progress
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_root_habit_progress(p_user_id UUID)
RETURNS TABLE (
  total_days_completed INTEGER,
  current_day INTEGER,
  completed_days INTEGER[],
  completion_percentage NUMERIC,
  is_completed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_days_completed,
    COALESCE(MAX(day_number), 0)::INTEGER AS current_day,
    ARRAY_AGG(day_number ORDER BY day_number)::INTEGER[] AS completed_days,
    ROUND((COUNT(*) * 100.0 / 30.0), 2) AS completion_percentage,
    (COUNT(*) >= 30) AS is_completed
  FROM public.root_habit_checkins
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_root_habit_progress(UUID) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
