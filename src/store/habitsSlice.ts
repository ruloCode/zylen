import { StateCreator } from 'zustand';
import { Habit } from '@/types';
import { HabitsService, LifeAreasService } from '@/services';

export interface HabitToggleResult {
  xpEarned: number;
  areaLevelUp?: {
    area: string;
    newLevel: number;
  };
}

export interface HabitsSlice {
  habits: Habit[];

  // Actions
  loadHabits: () => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (id: string, completed: boolean) => HabitToggleResult; // Returns XP earned and level up info
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
    if (!habit) return { xpEarned: 0 };

    const xpEarned = completed ? habit.xp : -habit.xp;

    // Update habit completion status
    set((state) => {
      const habits = state.habits.map((h) =>
        h.id === id
          ? { ...h, completed, completedAt: completed ? new Date() : undefined }
          : h
      );
      HabitsService.setHabits(habits);
      return { habits };
    });

    // Update life area XP if habit has an associated area
    let areaLevelUp: { area: string; newLevel: number } | undefined;
    if (habit.lifeArea) {
      const newLevel = LifeAreasService.updateAreaXP(habit.lifeArea, xpEarned);
      if (newLevel) {
        areaLevelUp = {
          area: habit.lifeArea,
          newLevel,
        };
      }
    }

    return { xpEarned, areaLevelUp };
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
