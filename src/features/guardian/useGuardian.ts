/**
 * useGuardian — composes recent behaviour into the Guardian's daily state:
 * darkness level (0-100) + the message he speaks today.
 */

import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, useHabits, useStreaks, useUser } from '@/store';
import type { AppStore } from '@/store';
import { StatsService, type DailyActivity } from '@/services/supabase/stats.service';
import {
  formatDayKeyInTimeZone,
  getHourInTimeZone,
  getProfileTimezone,
} from '@/services/supabase/timezone';
import { computeDarkness, isTrackableHabit } from './darkness';
import { pickGuardianMessage } from './engine';
import type { GuardianMessage } from './types';

export interface GuardianState {
  darkness: number;
  message: GuardianMessage;
  loading: boolean;
}

/** DEV-only darkness override: localStorage['zylen:debug-darkness'] = '0'..'100' */
function debugDarknessOverride(): number | null {
  if (!import.meta.env.DEV) return null;
  const raw = localStorage.getItem('zylen:debug-darkness');
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
}

export function useGuardian(): GuardianState {
  const { habits } = useHabits();
  const { streak } = useStreaks();
  const { user } = useUser();
  const lastLevelUp = useAppStore(
    useShallow((state: AppStore) => state.lastLevelUp)
  );

  const [activity, setActivity] = useState<DailyActivity[] | null>(null);
  useEffect(() => {
    let alive = true;
    StatsService.getDailyActivity(7).then((rows) => {
      if (alive) setActivity(rows);
    });
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => {
    const tz = getProfileTimezone();
    const dayKey = formatDayKeyInTimeZone(tz);

    const darkness =
      debugDarknessOverride() ?? computeDarkness(activity ?? [], habits);

    const trackable = habits.filter(isTrackableHabit);
    const message = pickGuardianMessage({
      todayTotal: trackable.length,
      todayDone: trackable.filter((h) => h.completedToday).length,
      currentStreak: streak?.currentStreak ?? 0,
      leveledUpToday:
        lastLevelUp && lastLevelUp.dayKey === dayKey ? lastLevelUp.level : null,
      darkness,
      hour: getHourInTimeZone(tz),
      dayKey,
      userName: user?.name?.split(' ')[0],
    });

    return { darkness, message, loading: activity === null };
  }, [habits, streak, user, lastLevelUp, activity]);
}
