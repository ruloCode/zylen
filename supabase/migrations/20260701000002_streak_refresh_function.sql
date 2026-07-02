-- ===========================================================================
-- refresh_user_streak: single source of truth for streak state
-- ===========================================================================
-- Recomputes the user's streak from habit_completions (self-healing):
--   * last_seven_days  -> one bit per local day, oldest first, today last
--   * current_streak   -> consecutive local days with >= 1 completion,
--                         ending today (or yesterday if today has none yet)
--   * longest_streak   -> monotonic max
--   * last_completion_date -> most recent local day with a completion
-- Replaces the old client-side logic that shifted last_seven_days on every
-- completion (which corrupted the array when completing 2+ habits per day).
-- Idempotent: CREATE OR REPLACE.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.refresh_user_streak(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tz TEXT;
  v_today DATE;
  v_last7 BOOLEAN[];
  v_current INTEGER := 0;
  v_check DATE;
  v_longest INTEGER;
  v_last_completion DATE;
BEGIN
  SELECT COALESCE(timezone, 'America/Bogota') INTO v_tz
  FROM public.profiles WHERE id = p_user_id;
  IF v_tz IS NULL THEN
    v_tz := 'America/Bogota';
  END IF;

  v_today := (NOW() AT TIME ZONE v_tz)::date;

  -- Last 7 local days, oldest first
  SELECT ARRAY(
    SELECT EXISTS (
      SELECT 1 FROM public.habit_completions hc
      WHERE hc.user_id = p_user_id
        AND (hc.completed_at AT TIME ZONE v_tz)::date = d.day::date
    )
    FROM generate_series(v_today - 6, v_today, INTERVAL '1 day') AS d(day)
  ) INTO v_last7;

  -- Most recent local day with a completion
  SELECT MAX((hc.completed_at AT TIME ZONE v_tz)::date) INTO v_last_completion
  FROM public.habit_completions hc
  WHERE hc.user_id = p_user_id;

  -- Current streak: walk back day by day (bounded to 400 days)
  v_check := v_today;
  IF NOT EXISTS (
    SELECT 1 FROM public.habit_completions hc
    WHERE hc.user_id = p_user_id
      AND (hc.completed_at AT TIME ZONE v_tz)::date = v_check
  ) THEN
    -- Today has no completion yet: a streak ending yesterday is still alive
    v_check := v_today - 1;
  END IF;

  WHILE v_current < 400 AND EXISTS (
    SELECT 1 FROM public.habit_completions hc
    WHERE hc.user_id = p_user_id
      AND (hc.completed_at AT TIME ZONE v_tz)::date = v_check
  ) LOOP
    v_current := v_current + 1;
    v_check := v_check - 1;
  END LOOP;

  INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_completion_date, last_seven_days)
  VALUES (p_user_id, v_current, v_current, v_last_completion, v_last7)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = GREATEST(public.streaks.longest_streak, EXCLUDED.current_streak),
    last_completion_date = EXCLUDED.last_completion_date,
    last_seven_days = EXCLUDED.last_seven_days,
    updated_at = timezone('utc'::text, now())
  RETURNING longest_streak INTO v_longest;

  RETURN jsonb_build_object(
    'current_streak', v_current,
    'longest_streak', v_longest,
    'last_completion_date', v_last_completion,
    'last_seven_days', to_jsonb(v_last7)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.refresh_user_streak(UUID) TO authenticated;

COMMENT ON FUNCTION public.refresh_user_streak IS 'Recomputes streak state from habit_completions in the user''s timezone (self-healing, idempotent)';
