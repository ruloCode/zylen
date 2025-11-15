import { StateCreator } from 'zustand';
import { Streak } from '@/types';
import { StreaksService } from '@/services';

export interface StreaksSlice {
  streak: Streak | null;

  // Actions
  loadStreak: () => void;
  updateStreakForToday: (completed: boolean) => void;
  getStreakBonus: () => number;
}

export const createStreaksSlice: StateCreator<StreaksSlice> = (set, get) => ({
  streak: null,

  loadStreak: () => {
    const streak = StreaksService.getStreak();
    if (!streak) {
      const newStreak = StreaksService.initializeStreak();
      set({ streak: newStreak });
    } else {
      set({ streak });
    }
  },

  updateStreakForToday: (completed: boolean) => {
    const updated = StreaksService.updateStreakForToday(completed);
    if (updated) {
      const streak = StreaksService.getStreak();
      set({ streak });
    }
  },

  getStreakBonus: () => {
    return StreaksService.getStreakBonus();
  },
});
