import { StateCreator } from 'zustand';
import { Streak } from '@/types';
import { StreaksService } from '@/services/supabase/streaks.service';

export interface StreaksSlice {
  streak: Streak | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadStreak: () => Promise<void>;
  updateStreakForToday: (completed: boolean) => Promise<void>;
  getStreakBonus: () => Promise<number>;
}

export const createStreaksSlice: StateCreator<StreaksSlice> = (set, get) => ({
  streak: null,
  isLoading: false,
  error: null,

  loadStreak: async () => {
    try {
      set({ isLoading: true, error: null });

      const streak = await StreaksService.getStreak();

      set({ streak, isLoading: false });
    } catch (error) {
      console.error('Error loading streak:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load streak',
        isLoading: false,
      });
    }
  },

  updateStreakForToday: async (completed: boolean) => {
    try {
      set({ isLoading: true, error: null });

      const updatedStreak = await StreaksService.updateStreakForToday(completed);

      set({ streak: updatedStreak, isLoading: false });
    } catch (error) {
      console.error('Error updating streak:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update streak',
        isLoading: false,
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
