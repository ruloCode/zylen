-- Migration: Create public profile view and search functions
-- Description: Provides safe public access to user profile data for social features

-- Create view for public user profiles
CREATE OR REPLACE VIEW v_user_public_profile AS
SELECT
  p.id,
  p.username,
  p.level,
  p.avatar_url,
  p.total_xp_earned,
  p.points,
  p.created_at,
  COALESCE(s.current_streak, 0) AS current_streak,
  COALESCE(s.longest_streak, 0) AS longest_streak
FROM profiles p
LEFT JOIN streaks s ON p.id = s.user_id
WHERE p.username IS NOT NULL;

-- Grant select permission to authenticated users
GRANT SELECT ON v_user_public_profile TO authenticated;

-- Create function to search users by username
CREATE OR REPLACE FUNCTION search_users_by_username(
  p_search_term TEXT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  username VARCHAR,
  level INT,
  avatar_url TEXT,
  current_streak INT,
  total_xp_earned INT,
  friendship_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vp.id,
    vp.username,
    vp.level,
    vp.avatar_url,
    vp.current_streak,
    vp.total_xp_earned,
    CASE
      WHEN f_sent.id IS NOT NULL AND f_sent.status = 'pending' THEN 'request_sent'
      WHEN f_received.id IS NOT NULL AND f_received.status = 'pending' THEN 'request_received'
      WHEN f_sent.id IS NOT NULL AND f_sent.status = 'accepted' THEN 'friends'
      WHEN f_received.id IS NOT NULL AND f_received.status = 'accepted' THEN 'friends'
      ELSE 'none'
    END AS friendship_status
  FROM v_user_public_profile vp
  LEFT JOIN friendships f_sent ON f_sent.user_id = auth.uid() AND f_sent.friend_id = vp.id
  LEFT JOIN friendships f_received ON f_received.user_id = vp.id AND f_received.friend_id = auth.uid()
  WHERE vp.username ILIKE '%' || p_search_term || '%'
    AND vp.id != auth.uid()
  ORDER BY
    -- Exact match first
    CASE WHEN vp.username ILIKE p_search_term THEN 0 ELSE 1 END,
    -- Then starts with
    CASE WHEN vp.username ILIKE p_search_term || '%' THEN 0 ELSE 1 END,
    -- Then by level (higher first)
    vp.level DESC,
    -- Then by XP
    vp.total_xp_earned DESC
  LIMIT p_limit;
END;
$$;

-- Create function to get friend list with stats
CREATE OR REPLACE FUNCTION get_friend_list(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  friendship_id UUID,
  user_id UUID,
  username VARCHAR,
  level INT,
  avatar_url TEXT,
  current_streak INT,
  longest_streak INT,
  total_xp_earned INT,
  points INT,
  friendship_status friendship_status,
  friendship_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Use provided user_id or current user
  v_user_id := COALESCE(p_user_id, auth.uid());

  RETURN QUERY
  SELECT
    f.id AS friendship_id,
    vp.id AS user_id,
    vp.username,
    vp.level,
    vp.avatar_url,
    vp.current_streak,
    vp.longest_streak,
    vp.total_xp_earned,
    vp.points,
    f.status AS friendship_status,
    f.created_at AS friendship_created_at
  FROM friendships f
  INNER JOIN v_user_public_profile vp ON
    CASE
      WHEN f.user_id = v_user_id THEN f.friend_id = vp.id
      WHEN f.friend_id = v_user_id THEN f.user_id = vp.id
    END
  WHERE (f.user_id = v_user_id OR f.friend_id = v_user_id)
    AND f.status = 'accepted'
  ORDER BY vp.level DESC, vp.total_xp_earned DESC;
END;
$$;

-- Create function to get pending friend requests (received)
CREATE OR REPLACE FUNCTION get_pending_friend_requests()
RETURNS TABLE(
  friendship_id UUID,
  user_id UUID,
  username VARCHAR,
  level INT,
  avatar_url TEXT,
  current_streak INT,
  total_xp_earned INT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id AS friendship_id,
    vp.id AS user_id,
    vp.username,
    vp.level,
    vp.avatar_url,
    vp.current_streak,
    vp.total_xp_earned,
    f.created_at
  FROM friendships f
  INNER JOIN v_user_public_profile vp ON f.user_id = vp.id
  WHERE f.friend_id = auth.uid()
    AND f.status = 'pending'
  ORDER BY f.created_at DESC;
END;
$$;

-- Create function to get sent friend requests
CREATE OR REPLACE FUNCTION get_sent_friend_requests()
RETURNS TABLE(
  friendship_id UUID,
  user_id UUID,
  username VARCHAR,
  level INT,
  avatar_url TEXT,
  current_streak INT,
  total_xp_earned INT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id AS friendship_id,
    vp.id AS user_id,
    vp.username,
    vp.level,
    vp.avatar_url,
    vp.current_streak,
    vp.total_xp_earned,
    f.created_at
  FROM friendships f
  INNER JOIN v_user_public_profile vp ON f.friend_id = vp.id
  WHERE f.user_id = auth.uid()
    AND f.status = 'pending'
  ORDER BY f.created_at DESC;
END;
$$;

-- Create function to remove friend (deletes both friendship records)
CREATE OR REPLACE FUNCTION remove_friend(p_friendship_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_friendship RECORD;
BEGIN
  -- Get friendship details
  SELECT * INTO v_friendship
  FROM friendships
  WHERE id = p_friendship_id;

  IF v_friendship IS NULL THEN
    RAISE EXCEPTION 'Friendship not found';
  END IF;

  -- Verify the current user is involved
  IF v_friendship.user_id != auth.uid() AND v_friendship.friend_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only remove your own friendships';
  END IF;

  -- Delete both directions of the friendship
  DELETE FROM friendships
  WHERE (user_id = v_friendship.user_id AND friend_id = v_friendship.friend_id)
     OR (user_id = v_friendship.friend_id AND friend_id = v_friendship.user_id);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_users_by_username(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_friend_list(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_friend_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION get_sent_friend_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION remove_friend(UUID) TO authenticated;

-- Add comments
COMMENT ON VIEW v_user_public_profile IS 'Public user profile data safe for social features';
COMMENT ON FUNCTION search_users_by_username(TEXT, INT) IS 'Search users by username with friendship status';
COMMENT ON FUNCTION get_friend_list(UUID) IS 'Get list of accepted friends with their stats';
COMMENT ON FUNCTION get_pending_friend_requests() IS 'Get friend requests received by current user';
COMMENT ON FUNCTION get_sent_friend_requests() IS 'Get friend requests sent by current user';
