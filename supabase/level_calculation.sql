-- ===========================================================================
-- Level Calculation Functions for Zylen
-- ===========================================================================
-- Centralized level calculation logic to ensure consistency
-- across all functions
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Function: calculate_user_level
-- Description: Calculate user level from total XP earned
-- Parameters:
--   p_total_xp: Total XP earned by the user
-- Returns: Calculated level (INTEGER)
-- Formula: level = floor(ln(totalXP / baseXP) / ln(multiplier)) + 1
--   Base XP: 350 (moderate progression)
--   Multiplier: 1.12
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_user_level(p_total_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Handle edge case: less than base XP
  IF p_total_xp < 350 THEN
    RETURN 1;
  END IF;

  -- Calculate level using corrected formula
  -- Base XP: 350, Multiplier: 1.12 (moderate progression)
  -- Formula: level = floor(ln(totalXP / 350) / ln(1.12)) + 1
  RETURN FLOOR(LN(p_total_xp::FLOAT / 350.0) / LN(1.12))::INTEGER + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.calculate_user_level(INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- Function: calculate_life_area_level
-- Description: Calculate life area level from total XP
-- Parameters:
--   p_total_xp: Total XP earned in this life area
-- Returns: Calculated level (INTEGER)
-- Formula: level = floor(ln(totalXP / baseXP) / ln(multiplier)) + 1
--   Base XP: 450 (harder than global, as per config)
--   Multiplier: 1.15
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_life_area_level(p_total_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Handle edge case: less than base XP
  IF p_total_xp < 450 THEN
    RETURN 1;
  END IF;

  -- Calculate level using corrected formula
  -- Base XP: 450, Multiplier: 1.15 (harder than global)
  -- Formula: level = floor(ln(totalXP / 450) / ln(1.15)) + 1
  RETURN FLOOR(LN(p_total_xp::FLOAT / 450.0) / LN(1.15))::INTEGER + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.calculate_life_area_level(INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------
COMMENT ON FUNCTION public.calculate_user_level IS 'Calculate user level from total XP using corrected formula (350 base, 1.12 multiplier)';
COMMENT ON FUNCTION public.calculate_life_area_level IS 'Calculate life area level from total XP using corrected formula (450 base, 1.15 multiplier)';
