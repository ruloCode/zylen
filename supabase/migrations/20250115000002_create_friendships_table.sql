-- Migration: Create friendships table
-- Description: Manages friend relationships between users

-- Create friendship status enum
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create friendships table
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_friendship UNIQUE(user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_friendships_user_status ON friendships(user_id, status);

-- Enable Row Level Security
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own friendships (both directions)
CREATE POLICY "Users can view their own friendships"
ON friendships
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- RLS Policy: Users can create friend requests
CREATE POLICY "Users can send friend requests"
ON friendships
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
);

-- RLS Policy: Users can update friendships they're involved in
CREATE POLICY "Users can update their friendships"
ON friendships
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR auth.uid() = friend_id
)
WITH CHECK (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- RLS Policy: Users can delete their own friendships
CREATE POLICY "Users can delete their friendships"
ON friendships
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Create trigger for updated_at
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get mutual friends count
CREATE OR REPLACE FUNCTION get_mutual_friends_count(p_user_id UUID, p_friend_id UUID)
RETURNS INT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT f1.friend_id)::INT
  FROM friendships f1
  INNER JOIN friendships f2 ON f1.friend_id = f2.friend_id
  WHERE f1.user_id = p_user_id
    AND f2.user_id = p_friend_id
    AND f1.status = 'accepted'
    AND f2.status = 'accepted';
$$;

-- Create function to send friend request
CREATE OR REPLACE FUNCTION send_friend_request(p_friend_username TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_friend_id UUID;
  v_existing_friendship UUID;
  v_friendship_id UUID;
BEGIN
  -- Get friend's user ID from username
  SELECT id INTO v_friend_id
  FROM profiles
  WHERE username = p_friend_username;

  IF v_friend_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if user is trying to add themselves
  IF v_friend_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot add yourself as a friend';
  END IF;

  -- Check if friendship already exists (in either direction)
  SELECT id INTO v_existing_friendship
  FROM friendships
  WHERE (user_id = auth.uid() AND friend_id = v_friend_id)
     OR (user_id = v_friend_id AND friend_id = auth.uid());

  IF v_existing_friendship IS NOT NULL THEN
    RAISE EXCEPTION 'Friendship already exists';
  END IF;

  -- Create friend request
  INSERT INTO friendships (user_id, friend_id, status)
  VALUES (auth.uid(), v_friend_id, 'pending')
  RETURNING id INTO v_friendship_id;

  RETURN v_friendship_id;
END;
$$;

-- Create function to accept friend request
CREATE OR REPLACE FUNCTION accept_friend_request(p_friendship_id UUID)
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
    RAISE EXCEPTION 'Friendship request not found';
  END IF;

  -- Verify the current user is the recipient
  IF v_friendship.friend_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only accept requests sent to you';
  END IF;

  -- Verify status is pending
  IF v_friendship.status != 'pending' THEN
    RAISE EXCEPTION 'This request has already been processed';
  END IF;

  -- Update status to accepted
  UPDATE friendships
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_friendship_id;

  -- Create reciprocal friendship
  INSERT INTO friendships (user_id, friend_id, status)
  VALUES (auth.uid(), v_friendship.user_id, 'accepted')
  ON CONFLICT (user_id, friend_id) DO NOTHING;
END;
$$;

-- Create function to reject friend request
CREATE OR REPLACE FUNCTION reject_friend_request(p_friendship_id UUID)
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
    RAISE EXCEPTION 'Friendship request not found';
  END IF;

  -- Verify the current user is the recipient
  IF v_friendship.friend_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only reject requests sent to you';
  END IF;

  -- Delete the request
  DELETE FROM friendships WHERE id = p_friendship_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_mutual_friends_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_friend_request(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_friend_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_friend_request(UUID) TO authenticated;

-- Add comments
COMMENT ON TABLE friendships IS 'Manages friend relationships between users';
COMMENT ON COLUMN friendships.status IS 'Status of the friendship: pending (request sent), accepted (both are friends), rejected (request denied)';
