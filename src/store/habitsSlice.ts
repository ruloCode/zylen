import { StateCreator } from 'zustand';
import { Habit } from '@/types';
import {
  HabitsService,
  HabitWithCompletion,
} from '@/services/supabase/habits.service';
import { StreaksService } from '@/services/supabase/streaks.service';
import { AchievementsService } from '@/services/supabase/achievements.service';

export interface HabitToggleResult {
  xpEarned: number;
  pointsEarned: number;
  areaLevelUp?: {
    area: string;
    newLevel: number;
  };
}

export interface HabitsSlice {
  habits: HabitWithCompletion[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadHabits: () => Promise<void>;
  addHabit: (habit: Partial<Habit>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabit: (id: string) => Promise<HabitToggleResult>;
  uncompleteHabit: (id: string) => Promise<void>;
  getTotalXPEarned: () => Promise<number>;
}

export const createHabitsSlice: StateCreator<HabitsSlice> = (set, get) => ({
  habits: [],
  isLoading: false,
  error: null,

  loadHabits: async () => {
    try {
      set({ isLoading: true, error: null });

      const habits = await HabitsService.getHabitsWithCompletions();

      set({ habits, isLoading: false });
    } catch (error) {
      console.error('Error loading habits:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load habits',
        isLoading: false,
      });
    }
  },

  addHabit: async (habit: Partial<Habit>) => {
    try {
      set({ isLoading: true, error: null });

      // Validate that lifeArea is provided (now required)
      if (!habit.lifeArea) {
        throw new Error('Habit must have a life area assigned');
      }

      const newHabit = await HabitsService.addHabit(habit);

      // Reload habits to get updated completion status
      const habits = await HabitsService.getHabitsWithCompletions();

      set({ habits, isLoading: false });
    } catch (error) {
      console.error('Error adding habit:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to add habit',
        isLoading: false,
      });
      throw error; // Re-throw so UI can handle
    }
  },

  updateHabit: async (id: string, updates: Partial<Habit>) => {
    try {
      set({ isLoading: true, error: null });

      await HabitsService.updateHabit(id, updates);

      // Reload habits to get updated data
      const habits = await HabitsService.getHabitsWithCompletions();

      set({ habits, isLoading: false });
    } catch (error) {
      console.error('Error updating habit:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update habit',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteHabit: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      await HabitsService.deleteHabit(id);

      // Remove from state
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error deleting habit:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete habit',
        isLoading: false,
      });
      throw error;
    }
  },

  completeHabit: async (id: string): Promise<HabitToggleResult> => {
    try {
      set({ isLoading: true, error: null });

      const habit = get().habits.find((h) => h.id === id);
      if (!habit) {
        throw new Error('Habit not found');
      }

      // Complete habit via RPC (handles points, XP, life area updates)
      const result = await HabitsService.completeHabit(id);

      // Update streak
      await StreaksService.updateStreakForToday(true);

      // Check and unlock achievements automatically
      try {
        const achievementResult = await AchievementsService.checkAndUnlockAchievements();
        if (achievementResult.newly_unlocked > 0) {
          console.log(`🎉 Unlocked ${achievementResult.newly_unlocked} achievement(s)!`, achievementResult.achievements_unlocked);
          // You could also show a notification here
        }
      } catch (err) {
        console.error('Error checking achievements:', err);
        // Don't fail the habit completion if achievement check fails
      }

      // Reload habits to get updated completion status
      const habits = await HabitsService.getHabitsWithCompletions();

      set({ habits, isLoading: false });

      return {
        xpEarned: result.xpEarned,
        pointsEarned: habit.points,
        // Note: areaLevelUp info is now handled by complete_habit RPC
        // We could extend the RPC return to include this info if needed
      };
    } catch (error) {
      console.error('Error completing habit:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to complete habit',
        isLoading: false,
      });
      throw error;
    }
  },

  uncompleteHabit: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      // Uncomplete habit via RPC (reverts points, XP, life area updates)
      await HabitsService.uncompleteHabit(id);

      // Check if any habits are still completed today
      const habits = await HabitsService.getHabitsWithCompletions();
      const anyCompleted = habits.some((h) => h.completedToday);

      // Update streak based on whether any habits are still completed
      await StreaksService.updateStreakForToday(anyCompleted);

      set({ habits, isLoading: false });
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to uncomplete habit',
        isLoading: false,
      });
      throw error;
    }
  },

  getTotalXPEarned: async () => {
    try {
      const totalXP = await HabitsService.getTotalXPEarnedToday();
      return totalXP;
    } catch (error) {
      console.error('Error getting total XP:', error);
      return 0;
    }
  },
});
