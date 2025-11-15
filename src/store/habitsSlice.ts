import { StateCreator } from 'zustand';
import { Habit } from '@/types';
import { HabitsService } from '@/services';

export interface HabitsSlice {
  habits: Habit[];

  // Actions
  loadHabits: () => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (id: string, completed: boolean) => number; // Returns XP earned
  resetDailyHabits: () => void;
  getTotalXPEarned: () => number;
}

export const createHabitsSlice: StateCreator<HabitsSlice> = (set, get) => ({
  habits: [],

  loadHabits: () => {
    const habits = HabitsService.getHabits();
    set({ habits });
  },

  addHabit: (habit: Habit) => {
    set((state) => {
      const newHabits = [...state.habits, habit];
      HabitsService.setHabits(newHabits);
      return { habits: newHabits };
    });
  },

  updateHabit: (id: string, updates: Partial<Habit>) => {
    set((state) => {
      const habits = state.habits.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      );
      HabitsService.setHabits(habits);
      return { habits };
    });
  },

  deleteHabit: (id: string) => {
    set((state) => {
      const habits = state.habits.filter((h) => h.id !== id);
      HabitsService.setHabits(habits);
      return { habits };
    });
  },

  toggleHabit: (id: string, completed: boolean) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return 0;

    const xpEarned = completed ? habit.xp : -habit.xp;

    set((state) => {
      const habits = state.habits.map((h) =>
        h.id === id
          ? { ...h, completed, completedAt: completed ? new Date() : undefined }
          : h
      );
      HabitsService.setHabits(habits);
      return { habits };
    });

    return xpEarned;
  },

  resetDailyHabits: () => {
    set((state) => {
      const habits = state.habits.map((h) => ({
        ...h,
        completed: false,
        completedAt: undefined,
      }));
      HabitsService.setHabits(habits);
      return { habits };
    });
  },

  getTotalXPEarned: () => {
    return get().habits
      .filter((h) => h.completed)
      .reduce((sum, h) => sum + h.xp, 0);
  },
});
