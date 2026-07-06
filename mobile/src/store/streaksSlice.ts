import { StateCreator } from 'zustand';
import { Streak } from '@/types';
import { StreaksService } from '@/services/supabase/streaks.service';

export interface StreaksSlice {
  streak: Streak | null;
  streakLoading: boolean;
  streakError: string | null;

  // Actions
  loadStreak: () => Promise<void>;
  /** Recompute the streak server-side (realigns last_seven_days to today). */
  refreshStreak: () => Promise<void>;
  updateStreakForToday: (completed: boolean) => Promise<void>;
  getStreakBonus: () => Promise<number>;
}

export const createStreaksSlice: StateCreator<StreaksSlice> = (set, get) => ({
  streak: null,
  streakLoading: false,
  streakError: null,

  loadStreak: async () => {
    try {
      set({ streakLoading: true, streakError: null });

      const streak = await StreaksService.getStreak();

      set({ streak, streakLoading: false });
    } catch (error) {
      console.error('Error loading streak:', error);
      set({
        streakError: error instanceof Error ? error.message : 'Failed to load streak',
        streakLoading: false,
      });
    }
  },

  refreshStreak: async () => {
    try {
      const streak = await StreaksService.refreshStreak();
      if (streak) set({ streak });
    } catch (error) {
      console.error('Error refreshing streak:', error);
      // Non-fatal: keep the last known streak rather than blanking the strip.
    }
  },

  updateStreakForToday: async (_completed: boolean) => {
    // The complete/uncomplete/relapse RPCs refresh the streak server-side and
    // the habits slice syncs it into the store. This action now just reloads
    // the authoritative value (the old client-side shifting corrupted the
    // last_seven_days array when completing several habits per day).
    try {
      const streak = await StreaksService.getStreak();
      set({ streak });
    } catch (error) {
      console.error('Error refreshing streak:', error);
      set({
        streakError: error instanceof Error ? error.message : 'Failed to update streak',
      });
    }
  },

  getStreakBonus: async () => {
    try {
      const bonus = await StreaksService.getStreakBonus();
      return bonus;
    } catch (error) {
      console.error('Error getting streak bonus:', error);
      return 1.0; // Default to no bonus
    }
  },
});
