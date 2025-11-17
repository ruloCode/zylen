-- Migration: Add username column to profiles table
-- Description: Adds unique username support for user profiles

-- Add username column to profiles table
ALTER TABLE profiles
ADD COLUMN username VARCHAR(20) UNIQUE;

-- Add index for faster username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- Add constraint to validate username format (3-20 chars, alphanumeric + underscore)
ALTER TABLE profiles
ADD CONSTRAINT check_username_format
CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$');

-- Create function to check username availability
CREATE OR REPLACE FUNCTION is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE username = p_username
  );
END;
$$;

-- Create function to generate suggested usernames based on name
CREATE OR REPLACE FUNCTION generate_username_suggestions(p_name TEXT, p_count INT DEFAULT 5)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_username TEXT;
  suggestions TEXT[] := '{}';
  candidate TEXT;
  counter INT := 1;
BEGIN
  -- Clean the name: remove spaces, special chars, convert to lowercase
  base_username := LOWER(REGEXP_REPLACE(p_name, '[^a-zA-Z0-9]', '', 'g'));

  -- Ensure base username is at least 3 chars
  IF LENGTH(base_username) < 3 THEN
    base_username := 'user';
  END IF;

  -- Truncate to max 15 chars to leave room for numbers
  base_username := SUBSTRING(base_username FROM 1 FOR 15);

  -- Add original base username if available
  IF is_username_available(base_username) THEN
    suggestions := array_append(suggestions, base_username);
  END IF;

  -- Generate numbered variations until we have enough suggestions
  WHILE array_length(suggestions, 1) < p_count AND counter < 1000 LOOP
    candidate := base_username || counter::TEXT;

    IF is_username_available(candidate) THEN
      suggestions := array_append(suggestions, candidate);
    END IF;

    counter := counter + 1;
  END LOOP;

  RETURN suggestions;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_username_available(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_username_suggestions(TEXT, INT) TO authenticated;

-- Add comment
COMMENT ON COLUMN profiles.username IS 'Unique username for social features (3-20 chars, alphanumeric + underscore)';
