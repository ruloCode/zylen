-- ===========================================================================
-- Habits v2 columns
-- ===========================================================================
-- Versions the live-DB state (habit_type/unit/daily_goal/color already exist
-- in production, added by hand) and adds the new v1-launch columns:
--   habits.time_of_day       -> 'morning' | 'afternoon' | 'evening' | 'anytime'
--   habits.reminder_enabled  -> per-habit local reminder toggle
--   habit_completions.value  -> value logged for measurable habits
-- Idempotent: safe to run multiple times.
-- ===========================================================================

-- Columns that may already exist in the live DB (versioning them here)
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS habit_type TEXT NOT NULL DEFAULT 'check',
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS daily_goal NUMERIC,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- New columns for v1 launch
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS time_of_day TEXT NOT NULL DEFAULT 'anytime',
  ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.habit_completions
  ADD COLUMN IF NOT EXISTS value NUMERIC;

-- Constraints (drop-then-add so re-runs don't fail)
ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_habit_type_check;
ALTER TABLE public.habits
  ADD CONSTRAINT habits_habit_type_check
  CHECK (habit_type IN ('check', 'measurable', 'quit'));

ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_time_of_day_check;
ALTER TABLE public.habits
  ADD CONSTRAINT habits_time_of_day_check
  CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'anytime'));

COMMENT ON COLUMN public.habits.time_of_day IS 'Preferred part of the day: morning | afternoon | evening | anytime';
COMMENT ON COLUMN public.habits.reminder_enabled IS 'Whether local PWA reminders are enabled for this habit';
COMMENT ON COLUMN public.habit_completions.value IS 'Logged value for measurable habits (e.g. minutes, reps)';
