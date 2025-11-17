-- Migration: Create weekly leaderboard table
-- Description: Tracks weekly user statistics for competitive leaderboard

-- Create weekly leaderboard table
CREATE TABLE weekly_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  weekly_xp_earned INT NOT NULL DEFAULT 0,
  weekly_points_earned INT NOT NULL DEFAULT 0,
  habits_completed INT NOT NULL DEFAULT 0,
  rank INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_week UNIQUE(user_id, week_start_date),
  CONSTRAINT valid_week_range CHECK (week_end_date > week_start_date),
  CONSTRAINT non_negative_stats CHECK (
    weekly_xp_earned >= 0
    AND weekly_points_earned >= 0
    AND habits_completed >= 0
  )
);

-- Create indexes for faster queries
CREATE INDEX idx_weekly_leaderboard_user_id ON weekly_leaderboard(user_id);
CREATE INDEX idx_weekly_leaderboard_week_start ON weekly_leaderboard(week_start_date);
CREATE INDEX idx_weekly_leaderboard_week_range ON weekly_leaderboard(week_start_date, week_end_date);
CREATE INDEX idx_weekly_leaderboard_rank ON weekly_leaderboard(week_start_date, rank);
CREATE INDEX idx_weekly_leaderboard_xp ON weekly_leaderboard(week_start_date, weekly_xp_earned DESC);

-- Enable Row Level Security
ALTER TABLE weekly_leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read leaderboard data
CREATE POLICY "Anyone can view leaderboard"
ON weekly_leaderboard
FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Only system can insert/update (via RPC functions)
CREATE POLICY "Only system can modify leaderboard"
ON weekly_leaderboard
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Create trigger for updated_at
CREATE TRIGGER update_weekly_leaderboard_updated_at
  BEFORE UPDATE ON weekly_leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get current week date range
CREATE OR REPLACE FUNCTION get_current_week_range()
RETURNS TABLE(week_start DATE, week_end DATE)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    DATE_TRUNC('week', CURRENT_DATE)::DATE AS week_start,
    (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE AS week_end;
$$;

-- Create function to track habit completion for leaderboard
CREATE OR REPLACE FUNCTION track_weekly_habit_completion(
  p_user_id UUID,
  p_xp_earned INT,
  p_points_earned INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
BEGIN
  -- Get current week range
  SELECT week_start, week_end INTO v_week_start, v_week_end
  FROM get_current_week_range();

  -- Insert or update weekly stats
  INSERT INTO weekly_leaderboard (
    user_id,
    week_start_date,
    week_end_date,
    weekly_xp_earned,
    weekly_points_earned,
    habits_completed
  )
  VALUES (
    p_user_id,
    v_week_start,
    v_week_end,
    p_xp_earned,
    p_points_earned,
    1
  )
  ON CONFLICT (user_id, week_start_date)
  DO UPDATE SET
    weekly_xp_earned = weekly_leaderboard.weekly_xp_earned + p_xp_earned,
    weekly_points_earned = weekly_leaderboard.weekly_points_earned + p_points_earned,
    habits_completed = weekly_leaderboard.habits_completed + 1,
    updated_at = NOW();
END;
$$;

-- Create function to update all ranks for current week
CREATE OR REPLACE FUNCTION update_current_week_ranks()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_start DATE;
BEGIN
  -- Get current week start
  SELECT week_start INTO v_week_start FROM get_current_week_range();

  -- Update ranks based on XP earned (primary) and points (tiebreaker)
  WITH ranked_users AS (
    SELECT
      id,
      RANK() OVER (
        ORDER BY weekly_xp_earned DESC, weekly_points_earned DESC, habits_completed DESC
      ) AS new_rank
    FROM weekly_leaderboard
    WHERE week_start_date = v_week_start
  )
  UPDATE weekly_leaderboard wl
  SET rank = ru.new_rank, updated_at = NOW()
  FROM ranked_users ru
  WHERE wl.id = ru.id;
END;
$$;

-- Create function to get weekly leaderboard with user position
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_week_start DATE DEFAULT NULL
)
RETURNS TABLE(
  rank INT,
  user_id UUID,
  username VARCHAR,
  avatar_url TEXT,
  weekly_xp_earned INT,
  weekly_points_earned INT,
  habits_completed INT,
  is_current_user BOOLEAN,
  level INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_start DATE;
  v_user_rank INT;
BEGIN
  -- Use provided week or current week
  IF p_week_start IS NULL THEN
    SELECT week_start INTO v_week_start FROM get_current_week_range();
  ELSE
    v_week_start := p_week_start;
  END IF;

  -- Update ranks before querying
  PERFORM update_current_week_ranks();

  -- Get current user's rank
  SELECT wl.rank INTO v_user_rank
  FROM weekly_leaderboard wl
  WHERE wl.user_id = p_user_id AND wl.week_start_date = v_week_start;

  -- Return top N users + current user if not in top N
  RETURN QUERY
  WITH top_users AS (
    SELECT
      wl.rank,
      wl.user_id,
      p.username,
      p.avatar_url,
      wl.weekly_xp_earned,
      wl.weekly_points_earned,
      wl.habits_completed,
      (wl.user_id = p_user_id) AS is_current_user,
      p.level
    FROM weekly_leaderboard wl
    INNER JOIN profiles p ON wl.user_id = p.id
    WHERE wl.week_start_date = v_week_start
      AND p.username IS NOT NULL
    ORDER BY wl.rank
    LIMIT p_limit
  ),
  user_entry AS (
    SELECT
      wl.rank,
      wl.user_id,
      p.username,
      p.avatar_url,
      wl.weekly_xp_earned,
      wl.weekly_points_earned,
      wl.habits_completed,
      true AS is_current_user,
      p.level
    FROM weekly_leaderboard wl
    INNER JOIN profiles p ON wl.user_id = p.id
    WHERE wl.user_id = p_user_id
      AND wl.week_start_date = v_week_start
      AND wl.rank > p_limit
  )
  SELECT * FROM top_users
  UNION ALL
  SELECT * FROM user_entry
  ORDER BY rank;
END;
$$;

-- Create function to get user's weekly rank
CREATE OR REPLACE FUNCTION get_user_weekly_rank(
  p_user_id UUID,
  p_week_start DATE DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_start DATE;
  v_rank INT;
BEGIN
  -- Use provided week or current week
  IF p_week_start IS NULL THEN
    SELECT week_start INTO v_week_start FROM get_current_week_range();
  ELSE
    v_week_start := p_week_start;
  END IF;

  -- Update ranks
  PERFORM update_current_week_ranks();

  -- Get user's rank
  SELECT rank INTO v_rank
  FROM weekly_leaderboard
  WHERE user_id = p_user_id AND week_start_date = v_week_start;

  RETURN COALESCE(v_rank, 0);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_current_week_range() TO authenticated;
GRANT EXECUTE ON FUNCTION track_weekly_habit_completion(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_current_week_ranks() TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard(UUID, INT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_weekly_rank(UUID, DATE) TO authenticated;

-- Add comments
COMMENT ON TABLE weekly_leaderboard IS 'Tracks weekly statistics for competitive leaderboard';
COMMENT ON COLUMN weekly_leaderboard.rank IS 'User rank for the week (1 = first place)';
COMMENT ON FUNCTION track_weekly_habit_completion(UUID, INT, INT) IS 'Updates weekly stats when user completes a habit';
COMMENT ON FUNCTION get_weekly_leaderboard(UUID, INT, DATE) IS 'Gets top N users for the week plus current user position';
