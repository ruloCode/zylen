-- ===========================================================================
-- get_daily_activity: real per-day completion counts in the user's timezone
-- ===========================================================================
-- Replaces the fake ACTIVITY_DATA / invented lastSevenDays fallbacks in the
-- client. Returns one row per local day (oldest first), zero-filled.
-- Idempotent: CREATE OR REPLACE.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.get_daily_activity(p_days INTEGER DEFAULT 7)
RETURNS TABLE (day DATE, completions INTEGER, xp INTEGER) AS $$
DECLARE
  v_user_id UUID;
  v_tz TEXT;
  v_today DATE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(timezone, 'America/Bogota') INTO v_tz
  FROM public.profiles WHERE id = v_user_id;
  IF v_tz IS NULL THEN
    v_tz := 'America/Bogota';
  END IF;

  v_today := (NOW() AT TIME ZONE v_tz)::date;

  RETURN QUERY
  SELECT
    d.day::date AS day,
    COALESCE(COUNT(hc.id), 0)::integer AS completions,
    COALESCE(SUM(hc.xp_earned), 0)::integer AS xp
  FROM generate_series(v_today - (GREATEST(p_days, 1) - 1), v_today, INTERVAL '1 day') AS d(day)
  LEFT JOIN public.habit_completions hc
    ON hc.user_id = v_user_id
    AND (hc.completed_at AT TIME ZONE v_tz)::date = d.day::date
  GROUP BY d.day
  ORDER BY d.day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_daily_activity(INTEGER) TO authenticated;

COMMENT ON FUNCTION public.get_daily_activity IS 'Per-local-day habit completion counts and XP for the authenticated user (zero-filled)';
