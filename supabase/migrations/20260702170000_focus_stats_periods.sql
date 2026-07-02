-- ===========================================================================
-- get_focus_stats v2 — month/year aggregates + period_starts
-- ===========================================================================
-- The vault gained Mes/Año tabs. Adds calendar-month and calendar-year
-- aggregates (user-timezone) plus the four period start timestamps so the
-- client filters recent_sessions with server-authoritative boundaries.
-- recent_sessions stays a single newest-first list (LIMIT 50): every period
-- window ends at now(), so a period's sessions are always a PREFIX of the
-- list — the client takes the first 25 for the platform grid and derives
-- the "+N" overflow chip from the aggregates, never from the list length.
-- Purely additive payload: pre-migration clients ignore the new keys.
-- ===========================================================================

CREATE INDEX IF NOT EXISTS focus_sessions_user_ended_idx
  ON public.focus_sessions(user_id, ended_at);

CREATE OR REPLACE FUNCTION public.get_focus_stats()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_user_timezone TEXT;
  v_today_date DATE;
  v_today_start TIMESTAMP;
  v_today_end TIMESTAMP;
  v_week_start TIMESTAMP;
  v_month_start TIMESTAMP;
  v_year_start TIMESTAMP;

  v_species_counts JSONB;
  v_today JSONB;
  v_week JSONB;
  v_month JSONB;
  v_year JSONB;
  v_recent JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(timezone, 'America/Bogota') INTO v_user_timezone
  FROM public.profiles WHERE id = v_user_id;
  IF v_user_timezone IS NULL THEN
    v_user_timezone := 'America/Bogota';
  END IF;

  v_today_date := (NOW() AT TIME ZONE v_user_timezone)::date;
  v_today_start := (v_today_date::timestamp AT TIME ZONE v_user_timezone) AT TIME ZONE 'UTC';
  v_today_end := v_today_start + INTERVAL '1 day' - INTERVAL '1 second';
  -- Rolling 7-day window (including today)
  v_week_start := v_today_start - INTERVAL '6 days';
  -- Calendar month / year in the user's timezone
  v_month_start := (date_trunc('month', NOW() AT TIME ZONE v_user_timezone)
                     AT TIME ZONE v_user_timezone) AT TIME ZONE 'UTC';
  v_year_start := (date_trunc('year', NOW() AT TIME ZONE v_user_timezone)
                    AT TIME ZONE v_user_timezone) AT TIME ZONE 'UTC';

  SELECT COALESCE(jsonb_object_agg(species, cnt), '{}'::jsonb)
  INTO v_species_counts
  FROM (
    SELECT species, COUNT(*)::int AS cnt
    FROM public.focus_sessions
    WHERE user_id = v_user_id AND status = 'completed'
    GROUP BY species
  ) t;

  SELECT jsonb_build_object(
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'broken',    COUNT(*) FILTER (WHERE status = 'broken'),
    'minutes',   COALESCE(SUM(duration_minutes) FILTER (WHERE status = 'completed'), 0),
    'xp',        COALESCE(SUM(xp_awarded) FILTER (WHERE status = 'completed'), 0)
  ) INTO v_today
  FROM public.focus_sessions
  WHERE user_id = v_user_id
    AND ended_at >= v_today_start AND ended_at <= v_today_end;

  SELECT jsonb_build_object(
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'broken',    COUNT(*) FILTER (WHERE status = 'broken'),
    'minutes',   COALESCE(SUM(duration_minutes) FILTER (WHERE status = 'completed'), 0),
    'xp',        COALESCE(SUM(xp_awarded) FILTER (WHERE status = 'completed'), 0)
  ) INTO v_week
  FROM public.focus_sessions
  WHERE user_id = v_user_id
    AND ended_at >= v_week_start AND ended_at <= v_today_end;

  SELECT jsonb_build_object(
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'broken',    COUNT(*) FILTER (WHERE status = 'broken'),
    'minutes',   COALESCE(SUM(duration_minutes) FILTER (WHERE status = 'completed'), 0),
    'xp',        COALESCE(SUM(xp_awarded) FILTER (WHERE status = 'completed'), 0)
  ) INTO v_month
  FROM public.focus_sessions
  WHERE user_id = v_user_id
    AND ended_at >= v_month_start AND ended_at <= v_today_end;

  SELECT jsonb_build_object(
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'broken',    COUNT(*) FILTER (WHERE status = 'broken'),
    'minutes',   COALESCE(SUM(duration_minutes) FILTER (WHERE status = 'completed'), 0),
    'xp',        COALESCE(SUM(xp_awarded) FILTER (WHERE status = 'completed'), 0)
  ) INTO v_year
  FROM public.focus_sessions
  WHERE user_id = v_user_id
    AND ended_at >= v_year_start AND ended_at <= v_today_end;

  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
  INTO v_recent
  FROM (
    SELECT s.id, s.species, s.duration_minutes, s.started_at, s.ended_at,
           s.status, s.break_reason, s.xp_awarded, g.name AS gem_name
    FROM public.focus_sessions s
    LEFT JOIN public.focus_gems g ON g.id = s.gem_id
    WHERE s.user_id = v_user_id AND s.status <> 'running'
    ORDER BY s.ended_at DESC NULLS LAST
    LIMIT 50
  ) r;

  RETURN jsonb_build_object(
    'species_counts', v_species_counts,
    'today', v_today,
    'week', v_week,
    'month', v_month,
    'year', v_year,
    'period_starts', jsonb_build_object(
      'today', v_today_start AT TIME ZONE 'UTC',
      'week', v_week_start AT TIME ZONE 'UTC',
      'month', v_month_start AT TIME ZONE 'UTC',
      'year', v_year_start AT TIME ZONE 'UTC'
    ),
    'recent_sessions', v_recent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_focus_stats() TO authenticated;

COMMENT ON FUNCTION public.get_focus_stats IS 'Vault + Arena data in one call: species counts, today/week/month/year aggregates, period start boundaries, recent sessions (50, newest first)';
