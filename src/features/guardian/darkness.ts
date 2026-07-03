/**
 * Darkness level (0-100): how much "oscuridad" surrounds the avatar based on
 * the habits the user failed to complete over the last week. Recent misses
 * weigh far more than old ones, and today's progress dispels fog live.
 */

import type { DailyActivity } from '@/services/supabase/stats.service';
import type { HabitWithCompletion } from '@/services/supabase/habits.service';
import { formatDayKeyInTimeZone, getProfileTimezone } from '@/services/supabase/timezone';

/** Recency weights for the 6 days before today, oldest → newest (sum 100). */
const DAY_WEIGHTS = [4, 6, 8, 12, 25, 45];

/** How much completing all of today's habits reduces accumulated darkness. */
const TODAY_DISPEL_FACTOR = 0.6;

/** Habits that count toward the daily "expected" total (quit habits are kept by inaction). */
export function isTrackableHabit(habit: HabitWithCompletion): boolean {
  return habit.habitType !== 'quit';
}

/**
 * Habits expected on a given day: trackable habits that already existed then.
 * Habits created later never count as missed retroactively.
 */
function expectedOnDay(habits: HabitWithCompletion[], dayKey: string, tz: string): number {
  return habits.filter((h) => {
    if (!isTrackableHabit(h)) return false;
    if (!h.createdAt) return true;
    return formatDayKeyInTimeZone(tz, new Date(h.createdAt)) <= dayKey;
  }).length;
}

/**
 * Compute darkness 0-100.
 *
 * @param activity  last-7-days activity (oldest first, today last) from
 *                  StatsService.getDailyActivity(7) — already zero-filled and
 *                  computed in the profile timezone by the backend.
 * @param habits    current habits (for per-day expected counts + today's progress)
 */
export function computeDarkness(
  activity: DailyActivity[],
  habits: HabitWithCompletion[]
): number {
  const tz = getProfileTimezone();
  const todayKey = formatDayKeyInTimeZone(tz);

  // Days before today, oldest first, aligned to the last 6 weights.
  const pastDays = activity.filter((d) => d.day < todayKey).slice(-DAY_WEIGHTS.length);

  let raw = 0;
  const offset = DAY_WEIGHTS.length - pastDays.length;
  pastDays.forEach((day, i) => {
    const expected = expectedOnDay(habits, day.day, tz);
    if (expected === 0) return;
    const missRatio = 1 - Math.min(day.completions / expected, 1);
    raw += (DAY_WEIGHTS[offset + i] ?? 0) * missRatio;
  });

  // Today's progress pushes the fog back in real time.
  const trackable = habits.filter(isTrackableHabit);
  const todayTotal = trackable.length;
  const todayDone = trackable.filter((h) => h.completedToday).length;
  const progress = todayTotal > 0 ? todayDone / todayTotal : 0;

  const darkness = Math.round(raw * (1 - TODAY_DISPEL_FACTOR * progress));
  return Math.max(0, Math.min(100, darkness));
}

/** Tier label key for the light/darkness indicator. */
export function darknessTier(darkness: number): 'clear' | 'low' | 'medium' | 'high' {
  if (darkness >= 60) return 'high';
  if (darkness >= 30) return 'medium';
  if (darkness > 0) return 'low';
  return 'clear';
}
