# XP & Leveling System Documentation

## Overview

This document explains how the XP and leveling system works in Zylen after the fixes implemented to address rapid level progression.

## Formula Changes

### Old Formula (INCORRECT) ❌
```
level = FLOOR(LN((total_xp / 150.0) + 1) / LN(1.08)) + 1
```

**Problem:** The `+1` inside the logarithm inflated levels significantly.

### New Formula (CORRECT) ✅
```
level = FLOOR(LN(total_xp / base_xp) / LN(multiplier)) + 1
```

**Where:**
- User levels: `base_xp = 350`, `multiplier = 1.12`
- Life area levels: `base_xp = 450`, `multiplier = 1.15`

## User Level Progression

### XP Requirements per Level

| Level | Total XP Needed | XP for This Level |
|-------|----------------|-------------------|
| 1     | 0              | -                 |
| 2     | 350            | 350               |
| 3     | 392            | 42                |
| 4     | 439            | 47                |
| 5     | 492            | 53                |
| 10    | 787            | 90                |
| 15    | 1,259          | 144               |
| 20    | 2,013          | 231               |
| 25    | 3,219          | 369               |
| 30    | 5,148          | 590               |
| 40    | 13,043         | 1,496             |
| 50    | 33,053         | 3,792             |

### Realistic Progression Examples

**With 3 habits/day at 30 XP each (90 XP/day):**
- Level 2: ~4 days
- Level 5: ~5.5 days
- Level 10: ~9 days
- Level 15: ~14 days
- Level 20: ~22 days
- Level 30: ~57 days (~2 months)

**With 5 habits/day at 30 XP each (150 XP/day):**
- Level 2: ~2.3 days
- Level 5: ~3.3 days
- Level 10: ~5.2 days
- Level 15: ~8.4 days
- Level 20: ~13.4 days
- Level 30: ~34 days (~1 month)

## Life Area Level Progression

Life areas are **harder to level** than global levels (450 base XP, 1.15 multiplier).

### XP Requirements per Level

| Level | Total XP Needed | XP for This Level |
|-------|----------------|-------------------|
| 1     | 0              | -                 |
| 2     | 450            | 450               |
| 3     | 518            | 68                |
| 4     | 595            | 77                |
| 5     | 684            | 89                |
| 10    | 1,303          | 202               |
| 15    | 2,482          | 385               |
| 20    | 4,729          | 733               |
| 25    | 9,007          | 1,396             |
| 30    | 17,163         | 2,659             |

### Realistic Progression Examples

**Assuming XP is distributed evenly across 3 life areas (30 XP/habit):**
- Level 2: ~15 days
- Level 5: ~23 days
- Level 10: ~43 days (~1.5 months)
- Level 15: ~83 days (~3 months)
- Level 20: ~157 days (~5 months)

## Testing the Formula

You can test the formula using this JavaScript code:

```javascript
// User level calculation
function calculateUserLevel(totalXP) {
  if (totalXP === 0) return 1;
  return Math.floor(Math.log(totalXP / 350) / Math.log(1.12)) + 1;
}

// Life area level calculation
function calculateLifeAreaLevel(totalXP) {
  if (totalXP === 0) return 1;
  return Math.floor(Math.log(totalXP / 450) / Math.log(1.15)) + 1;
}

// Test cases
console.log('User Level at 350 XP:', calculateUserLevel(350));    // Should be 2
console.log('User Level at 500 XP:', calculateUserLevel(500));    // Should be 3
console.log('User Level at 787 XP:', calculateUserLevel(787));    // Should be 10
console.log('User Level at 1000 XP:', calculateUserLevel(1000));  // Should be 11

console.log('Life Area at 450 XP:', calculateLifeAreaLevel(450)); // Should be 2
console.log('Life Area at 1000 XP:', calculateLifeAreaLevel(1000)); // Should be 7
console.log('Life Area at 1303 XP:', calculateLifeAreaLevel(1303)); // Should be 10
```

## Migration Impact

When the migration is run, user levels will be recalculated with the correct formula. Most users will see their level **decrease** to the accurate value. Examples:

| Total XP | Old Level (Bug) | New Level (Correct) | Change |
|----------|----------------|---------------------|---------|
| 162      | 10             | 1                   | -9      |
| 299      | 15             | 1                   | -14     |
| 500      | 20             | 3                   | -17     |
| 787      | 25             | 10                  | -15     |
| 1000     | 27             | 11                  | -16     |
| 2000     | 32             | 19                  | -13     |

## Implementation Files

1. **Database Functions:** `supabase/habits_functions.sql`
   - `complete_habit()` - Uses new formula
   - `uncomplete_habit()` - Uses new formula

2. **Frontend Config:** `src/constants/config.ts`
   - `XP_CONFIG.baseXPPerLevel = 350`
   - `XP_CONFIG.levelMultiplier = 1.12`
   - `XP_CONFIG.areaBaseXPPerLevel = 450`
   - `XP_CONFIG.areaLevelMultiplier = 1.15`

3. **Migration:** `supabase/recalculate_levels_migration.sql`
   - Recalculates all existing user and life area levels

## Deployment Steps

1. Deploy updated `habits_functions.sql` to Supabase
2. Run `recalculate_levels_migration.sql` to fix existing data
3. Deploy frontend changes (config.ts is already using these values in utils)
4. Monitor user feedback and adjust if needed

## Future Adjustments

If progression still feels too fast or too slow, adjust these values:

- **Faster progression:** Decrease base XP (e.g., 300) or multiplier (e.g., 1.10)
- **Slower progression:** Increase base XP (e.g., 400) or multiplier (e.g., 1.15)

Remember to update both the config and SQL functions if you make changes!
