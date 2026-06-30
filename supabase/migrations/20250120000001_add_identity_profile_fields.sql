-- Add identity & personalization fields to profiles
-- These let the game address the player correctly (gendered language in Spanish)
-- and tailor tone/content based on motivation, experience and age range.
-- All collected during onboarding right after account creation.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('female', 'male', 'neutral')),
  ADD COLUMN IF NOT EXISTS age_range TEXT,
  ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS motivation TEXT;

COMMENT ON COLUMN public.profiles.gender IS 'Player identity used to drive gendered language (female | male | neutral). Neutral uses generic/neutral copy.';
COMMENT ON COLUMN public.profiles.age_range IS 'Self-reported age bucket (e.g. 18-24) used to tailor tone/content.';
COMMENT ON COLUMN public.profiles.experience_level IS 'Self-reported experience with habit building (beginner | intermediate | advanced).';
COMMENT ON COLUMN public.profiles.motivation IS 'Primary reason the player uses the app (e.g. health, discipline, focus, wellbeing).';
