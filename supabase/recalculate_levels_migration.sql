-- ===========================================================================
-- Migration: Recalculate User and Life Area Levels
-- ===========================================================================
-- This migration recalculates all user and life area levels using the
-- corrected formula with updated progression values.
--
-- Changes:
-- 1. Fix formula bug (remove incorrect +1 inside logarithm)
-- 2. Update user progression: 350 base XP, 1.12 multiplier (moderate)
-- 3. Update life area progression: 450 base XP, 1.15 multiplier (harder)
--
-- IMPORTANT: This will reduce most user levels to more accurate values.
-- Run this migration AFTER deploying the updated habits_functions.sql
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Step 1: Recalculate all user levels using shared function
-- This ensures consistency with the level calculation functions
-- ---------------------------------------------------------------------------
UPDATE public.profiles
SET level = public.calculate_user_level(total_xp_earned);

-- ---------------------------------------------------------------------------
-- Step 2: Recalculate all life area levels using shared function
-- This ensures consistency with the level calculation functions
-- ---------------------------------------------------------------------------
UPDATE public.life_areas
SET level = public.calculate_life_area_level(total_xp);

-- ---------------------------------------------------------------------------
-- Verification queries (run separately to check results)
-- ---------------------------------------------------------------------------
-- Check user levels distribution:
-- SELECT level, COUNT(*) as user_count FROM public.profiles GROUP BY level ORDER BY level;

-- Check life area levels distribution:
-- SELECT level, COUNT(*) as area_count FROM public.life_areas GROUP BY level ORDER BY level;

-- Check specific examples:
-- SELECT id, total_xp_earned, level FROM public.profiles ORDER BY total_xp_earned DESC LIMIT 10;
-- SELECT id, total_xp, level FROM public.life_areas ORDER BY total_xp DESC LIMIT 10;
