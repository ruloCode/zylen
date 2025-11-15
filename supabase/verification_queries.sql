-- ===========================================================================
-- Verification Queries for Level System Deployment
-- ===========================================================================
-- Run these queries AFTER deploying all SQL files and migration
-- to verify that the level system is working correctly
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Verify Level Calculation Functions Exist
-- ---------------------------------------------------------------------------

-- Check if calculate_user_level function exists and has correct definition
SELECT
  proname as function_name,
  prosrc as source_code
FROM pg_proc
WHERE proname IN ('calculate_user_level', 'calculate_life_area_level');

-- Expected: You should see both functions listed with source code
-- Source code should reference 350 and 1.12 (not 150 and 1.08)

-- ---------------------------------------------------------------------------
-- 2. Test Level Calculation Function with Known Values
-- ---------------------------------------------------------------------------

-- Test user level calculation
SELECT
  xp,
  public.calculate_user_level(xp) as calculated_level,
  CASE
    WHEN xp = 0 THEN 1
    WHEN xp = 30 THEN 1
    WHEN xp = 162 THEN 1
    WHEN xp = 299 THEN 1
    WHEN xp = 350 THEN 1
    WHEN xp = 393 THEN 2
    WHEN xp = 500 THEN 4
    WHEN xp = 787 THEN 8
    WHEN xp = 971 THEN 10
    WHEN xp = 1000 THEN 10
  END as expected_level,
  public.calculate_user_level(xp) = CASE
    WHEN xp = 0 THEN 1
    WHEN xp = 30 THEN 1
    WHEN xp = 162 THEN 1
    WHEN xp = 299 THEN 1
    WHEN xp = 350 THEN 1
    WHEN xp = 393 THEN 2
    WHEN xp = 500 THEN 4
    WHEN xp = 787 THEN 8
    WHEN xp = 971 THEN 10
    WHEN xp = 1000 THEN 10
  END as is_correct
FROM (VALUES
  (0), (30), (162), (299), (350), (393), (500), (787), (971), (1000)
) AS test_xp(xp);

-- Expected: is_correct column should be TRUE for all rows

-- Test life area level calculation
SELECT
  xp,
  public.calculate_life_area_level(xp) as calculated_level,
  CASE
    WHEN xp = 0 THEN 1
    WHEN xp = 450 THEN 1
    WHEN xp = 518 THEN 2
    WHEN xp = 1000 THEN 6
    WHEN xp = 1584 THEN 10
    WHEN xp = 2000 THEN 11
  END as expected_level,
  public.calculate_life_area_level(xp) = CASE
    WHEN xp = 0 THEN 1
    WHEN xp = 450 THEN 1
    WHEN xp = 518 THEN 2
    WHEN xp = 1000 THEN 6
    WHEN xp = 1584 THEN 10
    WHEN xp = 2000 THEN 11
  END as is_correct
FROM (VALUES
  (0), (450), (518), (1000), (1584), (2000)
) AS test_xp(xp);

-- Expected: is_correct column should be TRUE for all rows

-- ---------------------------------------------------------------------------
-- 3. Verify User Levels Match Calculated Values
-- ---------------------------------------------------------------------------

-- Check all users: level should match what calculate_user_level returns
SELECT
  id,
  total_xp_earned,
  level as stored_level,
  public.calculate_user_level(total_xp_earned) as calculated_level,
  level = public.calculate_user_level(total_xp_earned) as is_consistent
FROM public.profiles
ORDER BY total_xp_earned DESC;

-- Expected: is_consistent should be TRUE for all users
-- If FALSE, run the migration again

-- ---------------------------------------------------------------------------
-- 4. Verify Life Area Levels Match Calculated Values
-- ---------------------------------------------------------------------------

-- Check all life areas: level should match what calculate_life_area_level returns
SELECT
  id,
  area_type,
  total_xp,
  level as stored_level,
  public.calculate_life_area_level(total_xp) as calculated_level,
  level = public.calculate_life_area_level(total_xp) as is_consistent
FROM public.life_areas
WHERE enabled = true
ORDER BY total_xp DESC;

-- Expected: is_consistent should be TRUE for all life areas
-- If FALSE, run the migration again

-- ---------------------------------------------------------------------------
-- 5. Check User Level Distribution
-- ---------------------------------------------------------------------------

-- See how many users are at each level
SELECT
  level,
  COUNT(*) as user_count,
  MIN(total_xp_earned) as min_xp,
  MAX(total_xp_earned) as max_xp,
  ROUND(AVG(total_xp_earned)) as avg_xp
FROM public.profiles
GROUP BY level
ORDER BY level;

-- Expected: Distribution should make sense
-- Level 1: 0-392 XP
-- Level 2: 393-439 XP
-- Level 3: 440-491 XP
-- etc.

-- ---------------------------------------------------------------------------
-- 6. Check Life Area Level Distribution
-- ---------------------------------------------------------------------------

-- See how many life areas are at each level
SELECT
  level,
  COUNT(*) as area_count,
  MIN(total_xp) as min_xp,
  MAX(total_xp) as max_xp,
  ROUND(AVG(total_xp)) as avg_xp
FROM public.life_areas
WHERE enabled = true
GROUP BY level
ORDER BY level;

-- Expected: Distribution should make sense
-- Level 1: 0-517 XP
-- Level 2: 518-595 XP
-- Level 3: 596-684 XP
-- etc.

-- ---------------------------------------------------------------------------
-- 7. Verify Recent Habit Completions Update Levels Correctly
-- ---------------------------------------------------------------------------

-- Check the last 10 habit completions and their XP
SELECT
  hc.id,
  hc.user_id,
  hc.xp_earned,
  hc.completed_at,
  p.total_xp_earned,
  p.level,
  public.calculate_user_level(p.total_xp_earned) as expected_level,
  p.level = public.calculate_user_level(p.total_xp_earned) as is_correct
FROM public.habit_completions hc
JOIN public.profiles p ON hc.user_id = p.id
ORDER BY hc.completed_at DESC
LIMIT 10;

-- Expected: is_correct should be TRUE for all recent completions

-- ---------------------------------------------------------------------------
-- 8. Verify XP Progression is Realistic
-- ---------------------------------------------------------------------------

-- Calculate how many days it would take to reach each level
-- assuming 3 habits/day at 30 XP each (90 XP/day)
WITH level_progression AS (
  SELECT
    generate_series(1, 30) as level
)
SELECT
  level,
  CASE
    WHEN level = 1 THEN 0
    ELSE CEIL(350.0 * POWER(1.12, level - 1))
  END as total_xp_needed,
  CASE
    WHEN level = 1 THEN 0
    ELSE CEIL((350.0 * POWER(1.12, level - 1)) / 90.0)
  END as days_at_90xp_per_day,
  CASE
    WHEN level = 1 THEN 0
    ELSE CEIL((350.0 * POWER(1.12, level - 1)) / 90.0 / 30.0)
  END as months_at_90xp_per_day
FROM level_progression
WHERE level IN (1, 2, 5, 10, 15, 20, 25, 30);

-- Expected progression (3 habits/day @ 30 XP):
-- Level 2: ~5 days
-- Level 5: ~7 days
-- Level 10: ~11 days
-- Level 20: ~34 days (~1 month)
-- Level 30: ~105 days (~3.5 months)

-- ---------------------------------------------------------------------------
-- 9. Find Users Who Might Be Affected by Level Change
-- ---------------------------------------------------------------------------

-- Find users whose level would have been different with old formula
SELECT
  id,
  total_xp_earned,
  level as current_level,
  public.calculate_user_level(total_xp_earned) as correct_level,
  FLOOR(LN((total_xp_earned::FLOAT / 150.0) + 1) / LN(1.08))::INTEGER + 1 as old_buggy_level,
  (FLOOR(LN((total_xp_earned::FLOAT / 150.0) + 1) / LN(1.08))::INTEGER + 1) - public.calculate_user_level(total_xp_earned) as level_difference
FROM public.profiles
WHERE total_xp_earned > 0
  AND level != FLOOR(LN((total_xp_earned::FLOAT / 150.0) + 1) / LN(1.08))::INTEGER + 1
ORDER BY level_difference DESC;

-- Expected: Should show users whose levels were corrected
-- level_difference shows how many levels they lost (should be positive)

-- ---------------------------------------------------------------------------
-- 10. Summary Statistics
-- ---------------------------------------------------------------------------

-- Overall health check
SELECT
  'Total Users' as metric,
  COUNT(*)::TEXT as value
FROM public.profiles
UNION ALL
SELECT
  'Users with Consistent Levels',
  COUNT(*)::TEXT
FROM public.profiles
WHERE level = public.calculate_user_level(total_xp_earned)
UNION ALL
SELECT
  'Users with Inconsistent Levels',
  COUNT(*)::TEXT
FROM public.profiles
WHERE level != public.calculate_user_level(total_xp_earned)
UNION ALL
SELECT
  'Total Life Areas',
  COUNT(*)::TEXT
FROM public.life_areas
WHERE enabled = true
UNION ALL
SELECT
  'Life Areas with Consistent Levels',
  COUNT(*)::TEXT
FROM public.life_areas
WHERE enabled = true AND level = public.calculate_life_area_level(total_xp)
UNION ALL
SELECT
  'Life Areas with Inconsistent Levels',
  COUNT(*)::TEXT
FROM public.life_areas
WHERE enabled = true AND level != public.calculate_life_area_level(total_xp);

-- Expected:
-- - Users with Inconsistent Levels: 0
-- - Life Areas with Inconsistent Levels: 0

-- ---------------------------------------------------------------------------
-- PASS CRITERIA
-- ---------------------------------------------------------------------------
-- ✅ All functions exist and have correct source code (350, 1.12)
-- ✅ Test calculations return correct levels (is_correct = TRUE)
-- ✅ All users have consistent levels (is_consistent = TRUE)
-- ✅ All life areas have consistent levels (is_consistent = TRUE)
-- ✅ Level distribution makes sense
-- ✅ Recent completions have correct levels
-- ✅ Progression is realistic (Level 10 in ~11 days with 3 habits/day)
-- ✅ Summary shows 0 inconsistent users and life areas
