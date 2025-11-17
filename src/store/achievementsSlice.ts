/**
 * Achievements Slice - Zustand State Management
 *
 * Manages state for the achievement/badge system
 */

import { StateCreator } from 'zustand';
import type {
  Achievement,
  UserAchievement,
  AchievementWithProgress,
  AchievementUnlockResult,
} from '@/types/achievement';
import { AchievementsService } from '@/services/supabase/achievements.service';

export interface AchievementsSlice {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  achievementsWithProgress: AchievementWithProgress[];
  unlockedCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAchievements: () => Promise<void>;
  loadAchievementsWithProgress: () => Promise<void>;
  checkAndUnlockAchievements: () => Promise<AchievementUnlockResult>;
  getAchievementsByCategory: (category: string) => Promise<AchievementWithProgress[]>;
  refreshAchievements: () => Promise<void>;
}

export const createAchievementsSlice: StateCreator<AchievementsSlice> = (set) => ({
  achievements: [],
  userAchievements: [],
  achievementsWithProgress: [],
  unlockedCount: 0,
  isLoading: false,
  error: null,

  loadAchievements: async () => {
    try {
      set({ isLoading: true, error: null });

      const [achievements, userAchievements, unlockedCount] = await Promise.all([
        AchievementsService.getAllAchievements(),
        AchievementsService.getUserAchievements(),
        AchievementsService.getUnlockedCount(),
      ]);

      set({
        achievements,
        userAchievements,
        unlockedCount,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading achievements:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load achievements',
        isLoading: false,
      });
    }
  },

  loadAchievementsWithProgress: async () => {
    try {
      set({ isLoading: true, error: null });

      const [achievementsWithProgress, unlockedCount] = await Promise.all([
        AchievementsService.getAchievementsWithProgress(),
        AchievementsService.getUnlockedCount(),
      ]);

      set({
        achievementsWithProgress,
        unlockedCount,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading achievements with progress:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load achievements',
        isLoading: false,
      });
    }
  },

  checkAndUnlockAchievements: async () => {
    try {
      const result = await AchievementsService.checkAndUnlockAchievements();

      // If achievements were unlocked, refresh the data
      if (result.newly_unlocked > 0) {
        const [achievementsWithProgress, userAchievements, unlockedCount] =
          await Promise.all([
            AchievementsService.getAchievementsWithProgress(),
            AchievementsService.getUserAchievements(),
            AchievementsService.getUnlockedCount(),
          ]);

        set({
          achievementsWithProgress,
          userAchievements,
          unlockedCount,
        });
      }

      return result;
    } catch (error) {
      console.error('Error checking/unlocking achievements:', error);
      return { newly_unlocked: 0, achievements_unlocked: [] };
    }
  },

  getAchievementsByCategory: async (category: string) => {
    try {
      const achievements = await AchievementsService.getAchievementsByCategory(category);
      return achievements;
    } catch (error) {
      console.error('Error getting achievements by category:', error);
      return [];
    }
  },

  refreshAchievements: async () => {
    try {
      set({ isLoading: true, error: null });

      const [achievements, userAchievements, achievementsWithProgress, unlockedCount] =
        await Promise.all([
          AchievementsService.getAllAchievements(),
          AchievementsService.getUserAchievements(),
          AchievementsService.getAchievementsWithProgress(),
          AchievementsService.getUnlockedCount(),
        ]);

      set({
        achievements,
        userAchievements,
        achievementsWithProgress,
        unlockedCount,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error refreshing achievements:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to refresh achievements',
        isLoading: false,
      });
    }
  },
});
