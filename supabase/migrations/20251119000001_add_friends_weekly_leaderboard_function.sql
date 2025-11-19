-- Migration: Add friends-only weekly leaderboard function
-- Description: Returns weekly leaderboard filtered by accepted friendships

-- Create function to get friends-only weekly leaderboard
CREATE OR REPLACE FUNCTION get_friends_weekly_leaderboard(
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
  v_has_friends BOOLEAN;
BEGIN
  -- Use provided week or current week
  IF p_week_start IS NULL THEN
    SELECT week_start INTO v_week_start FROM get_current_week_range();
  ELSE
    v_week_start := p_week_start;
  END IF;

  -- Update ranks before querying
  PERFORM update_current_week_ranks();

  -- Check if user has any accepted friends
  SELECT EXISTS(
    SELECT 1
    FROM friendships
    WHERE user_id = p_user_id
      AND status = 'accepted'
  ) INTO v_has_friends;

  -- Get current user's rank
  SELECT wl.rank INTO v_user_rank
  FROM weekly_leaderboard wl
  WHERE wl.user_id = p_user_id AND wl.week_start_date = v_week_start;

  -- Return friends leaderboard + current user if not in top friends
  RETURN QUERY
  WITH friends_list AS (
    -- Get all accepted friends
    SELECT DISTINCT f.friend_id AS user_id
    FROM friendships f
    WHERE f.user_id = p_user_id
      AND f.status = 'accepted'
  ),
  top_friends AS (
    -- Get top N friends from leaderboard
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
    INNER JOIN friends_list fl ON wl.user_id = fl.user_id
    WHERE wl.week_start_date = v_week_start
      AND p.username IS NOT NULL
    ORDER BY wl.rank
    LIMIT p_limit
  ),
  user_entry AS (
    -- Include current user if they exist and are not in top friends
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
      -- Only include if user has rank and is not already in top friends
      AND wl.rank IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM top_friends tf WHERE tf.user_id = p_user_id
      )
  )
  SELECT * FROM top_friends
  UNION ALL
  SELECT * FROM user_entry
  ORDER BY rank;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_friends_weekly_leaderboard(UUID, INT, DATE) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_friends_weekly_leaderboard(UUID, INT, DATE) IS 'Gets top N friends from weekly leaderboard plus current user position';
