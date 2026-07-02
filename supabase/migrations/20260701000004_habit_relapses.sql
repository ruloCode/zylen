-- ===========================================================================
-- habit_relapses: real relapse tracking for 'quit' habits
-- ===========================================================================
-- Before this, a relapse was just "uncomplete + toast" with no persistence.
-- record_relapse(p_habit_id):
--   1. Reverts today's completion if it exists (exact XP, via uncomplete_habit)
--   2. Persists the relapse event
--   3. Returns the refreshed streak + relapse info
-- Idempotent: CREATE TABLE IF NOT EXISTS / CREATE OR REPLACE / drop policies.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.habit_relapses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  relapsed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_habit_relapses_user_habit
  ON public.habit_relapses (user_id, habit_id, relapsed_at DESC);

ALTER TABLE public.habit_relapses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own relapses" ON public.habit_relapses;
CREATE POLICY "Users can view own relapses"
  ON public.habit_relapses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own relapses" ON public.habit_relapses;
CREATE POLICY "Users can insert own relapses"
  ON public.habit_relapses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own relapses" ON public.habit_relapses;
CREATE POLICY "Users can delete own relapses"
  ON public.habit_relapses FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- record_relapse
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_relapse(p_habit_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_habit RECORD;
  v_user_timezone TEXT;
  v_today_date DATE;
  v_today_start TIMESTAMP;
  v_today_end TIMESTAMP;
  v_reverted JSONB := NULL;
  v_relapse_id UUID;
  v_streak JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_habit
  FROM public.habits
  WHERE id = p_habit_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Habit not found';
  END IF;

  SELECT COALESCE(timezone, 'America/Bogota') INTO v_user_timezone
  FROM public.profiles WHERE id = v_user_id;
  IF v_user_timezone IS NULL THEN
    v_user_timezone := 'America/Bogota';
  END IF;

  v_today_date := (NOW() AT TIME ZONE v_user_timezone)::date;
  v_today_start := (v_today_date::timestamp AT TIME ZONE v_user_timezone) AT TIME ZONE 'UTC';
  v_today_end := v_today_start + INTERVAL '1 day' - INTERVAL '1 second';

  -- Revert today's completion if the habit was already marked as resisted
  IF EXISTS (
    SELECT 1 FROM public.habit_completions
    WHERE habit_id = p_habit_id
      AND user_id = v_user_id
      AND completed_at >= v_today_start
      AND completed_at <= v_today_end
  ) THEN
    v_reverted := public.uncomplete_habit(p_habit_id);
  END IF;

  INSERT INTO public.habit_relapses (user_id, habit_id)
  VALUES (v_user_id, p_habit_id)
  RETURNING id INTO v_relapse_id;

  -- uncomplete_habit already refreshed the streak; refresh again only if not
  v_streak := COALESCE(v_reverted -> 'streak', public.refresh_user_streak(v_user_id));

  RETURN jsonb_build_object(
    'relapse_id', v_relapse_id,
    'reverted', v_reverted IS NOT NULL,
    'reverted_details', v_reverted,
    'streak', v_streak
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.record_relapse(UUID) TO authenticated;

COMMENT ON TABLE public.habit_relapses IS 'Relapse events for quit-type habits';
COMMENT ON FUNCTION public.record_relapse IS 'Reverts today''s completion (if any) and persists a relapse event for a quit habit';
