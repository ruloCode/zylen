-- Add timezone column to profiles table
-- This allows each user to have their own timezone for accurate habit reset times

-- Add timezone column with default value
ALTER TABLE public.profiles
ADD COLUMN timezone TEXT DEFAULT 'America/Bogota' NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.timezone IS 'User timezone in IANA timezone format (e.g., America/Bogota, America/New_York). Used to determine when habits reset (00:00 local time).';

-- Update existing users to have a default timezone
-- This ensures backward compatibility
UPDATE public.profiles
SET timezone = 'America/Bogota'
WHERE timezone IS NULL;

-- Create index for faster timezone lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_timezone ON public.profiles(timezone);
