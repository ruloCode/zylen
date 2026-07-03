import { StateCreator } from 'zustand';
import { formatDayKeyInTimeZone, getProfileTimezone } from '@/services/supabase/timezone';

export interface GuardianSlice {
  /**
   * Transient record of the last level-up so the Guardian can celebrate it
   * the same day it happened (session-scoped; not persisted).
   */
  lastLevelUp: { level: number; dayKey: string } | null;
  setLastLevelUp: (level: number) => void;
}

export const createGuardianSlice: StateCreator<GuardianSlice> = (set) => ({
  lastLevelUp: null,

  setLastLevelUp: (level: number) => {
    set({
      lastLevelUp: {
        level,
        dayKey: formatDayKeyInTimeZone(getProfileTimezone()),
      },
    });
  },
});
