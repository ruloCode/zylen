# Supabase Deployment Guide

This guide explains how to deploy the level system fixes to your Supabase database.

## 🚨 Critical: Level System Fix

**Problem:** Users are getting incorrect levels due to an old formula deployed in Supabase.
- Old formula: 150 base XP, 1.08 multiplier (with bug)
- New formula: 350 base XP, 1.12 multiplier (moderate progression)

**Impact:** With only 30 XP, users show Level 3 instead of Level 1.

---

## 📋 Deployment Order

Deploy SQL files in this exact order:

### 1. Deploy Level Calculation Functions (FIRST)

**File:** `level_calculation.sql`

This creates shared, reusable functions for calculating levels. All other functions depend on this.

**Functions created:**
- `calculate_user_level(total_xp)` - Calculates global user level
- `calculate_life_area_level(total_xp)` - Calculates life area level

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy entire contents of `level_calculation.sql`
4. Paste into SQL Editor
5. Click "Run" or press `Ctrl/Cmd + Enter`
6. Verify success message

### 2. Deploy Core Functions (SECOND)

**File:** `functions.sql`

Updates `update_user_xp()` to use the new shared level calculation function.

**Functions updated:**
- `update_user_points()` - No changes
- `update_user_xp()` - Now uses `calculate_user_level()`
- `get_user_stats()` - No changes

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy entire contents of `functions.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Verify success message

### 3. Deploy Habit Functions (THIRD)

**File:** `habits_functions.sql`

Updates habit completion functions to use shared level calculation functions.

**Functions updated:**
- `complete_habit()` - Now uses `calculate_user_level()` and `calculate_life_area_level()`
- `uncomplete_habit()` - Now uses `calculate_user_level()` and `calculate_life_area_level()`

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy entire contents of `habits_functions.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Verify success message

### 4. Run Migration (FOURTH)

**File:** `recalculate_levels_migration.sql`

Recalculates all existing user levels using the correct formula.

**⚠️ WARNING:** This will change user levels! Most will decrease.

**What it does:**
- Recalculates `profiles.level` for all users
- Recalculates `life_areas.level` for all life areas
- Uses the correct formulas (350 base, 1.12 multiplier for users)

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy entire contents of `recalculate_levels_migration.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Check the output for number of rows updated

### 5. Verify Deployment (FIFTH)

**File:** `verification_queries.sql`

Run verification queries to ensure everything is working correctly.

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Copy queries from `verification_queries.sql` one by one
3. Run each query separately
4. Verify results match expected values

---

## 🧪 Testing After Deployment

### Test 1: Verify Function Definitions

```sql
-- Check calculate_user_level function
SELECT prosrc
FROM pg_proc
WHERE proname = 'calculate_user_level';

-- Check calculate_life_area_level function
SELECT prosrc
FROM pg_proc
WHERE proname = 'calculate_life_area_level';
```

**Expected:** Function source should show `350` and `1.12` (not `150` and `1.08`)

### Test 2: Verify User Levels

```sql
-- Check a specific user's level
SELECT id, total_xp_earned, level,
       public.calculate_user_level(total_xp_earned) as calculated_level
FROM profiles
WHERE id = '<your-user-id>';
```

**Expected:**
- With 30 XP: level should be 1
- `level` column should match `calculated_level`

### Test 3: Complete a Habit

1. Go to the app
2. Complete a habit (30 XP default)
3. Check your level in the database:

```sql
SELECT total_xp_earned, level FROM profiles WHERE id = '<your-user-id>';
```

**Expected:**
- 30 XP → Level 1
- 350 XP → Level 2
- 393 XP → Level 2
- 440 XP → Level 3

### Test 4: Verify Level Progression

Run the test script:

```sql
-- Test various XP values
SELECT
  xp,
  public.calculate_user_level(xp) as level
FROM (VALUES
  (0), (30), (162), (299), (350), (393), (500), (787), (1000), (2000)
) AS test_xp(xp);
```

**Expected results:**
| XP   | Level |
|------|-------|
| 0    | 1     |
| 30   | 1     |
| 162  | 1     |
| 299  | 1     |
| 350  | 1     |
| 393  | 2     |
| 500  | 4     |
| 787  | 8     |
| 1000 | 10    |
| 2000 | 16    |

---

## 🔧 Troubleshooting

### Issue: Function already exists error

**Solution:** The `CREATE OR REPLACE FUNCTION` should handle this automatically. If it doesn't:

```sql
DROP FUNCTION IF EXISTS public.calculate_user_level(INTEGER);
DROP FUNCTION IF EXISTS public.calculate_life_area_level(INTEGER);
```

Then re-run the `level_calculation.sql` file.

### Issue: Users still have wrong levels

**Solution:** Re-run the migration:

```sql
-- Recalculate all user levels
UPDATE public.profiles
SET level = public.calculate_user_level(total_xp_earned);

-- Recalculate all life area levels
UPDATE public.life_areas
SET level = public.calculate_life_area_level(total_xp);
```

### Issue: Permissions error

**Solution:** Make sure you're running as the Supabase admin user, or grant permissions:

```sql
GRANT EXECUTE ON FUNCTION public.calculate_user_level(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_life_area_level(INTEGER) TO authenticated;
```

---

## 📊 Expected Changes

After deployment, you should see:

### User Levels (with correct formula)

| Total XP | Old Level (Bug) | New Level (Correct) | Change |
|----------|----------------|---------------------|---------|
| 30       | 3              | 1                   | -2      |
| 162      | 10             | 1                   | -9      |
| 299      | 15             | 1                   | -14     |
| 500      | 20             | 4                   | -16     |
| 787      | 25             | 8                   | -17     |
| 1000     | 27             | 10                  | -17     |

### Progression Examples

**With 3 habits/day @ 30 XP each (90 XP/day):**
- Level 2: ~5 days
- Level 5: ~7 days
- Level 10: ~11 days
- Level 20: ~34 days (~1 month)

---

## 📝 Deployment Checklist

- [ ] Backup your database (optional but recommended)
- [ ] Deploy `level_calculation.sql`
- [ ] Deploy `functions.sql`
- [ ] Deploy `habits_functions.sql`
- [ ] Run `recalculate_levels_migration.sql`
- [ ] Run verification queries
- [ ] Test completing a habit in the app
- [ ] Verify user levels are correct
- [ ] Check that no errors appear in the console

---

## 🎯 Success Criteria

Deployment is successful when:

1. ✅ All SQL files execute without errors
2. ✅ `calculate_user_level(30)` returns `1` (not `3`)
3. ✅ `calculate_user_level(350)` returns `1` (not `9`)
4. ✅ `calculate_user_level(393)` returns `2`
5. ✅ Completing a habit updates level correctly
6. ✅ User levels in database match calculated values
7. ✅ No errors in app console when viewing profile

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Run the verification queries
3. Check Supabase logs for errors
4. Verify function definitions using the test queries

## 🔄 Rolling Back (Emergency Only)

If you need to roll back (not recommended):

```sql
-- Restore old formula (NOT RECOMMENDED)
DROP FUNCTION IF EXISTS public.calculate_user_level(INTEGER);
DROP FUNCTION IF EXISTS public.calculate_life_area_level(INTEGER);

-- Then redeploy the old functions.sql
```

**Note:** This will restore the buggy behavior. Only do this as a last resort.
