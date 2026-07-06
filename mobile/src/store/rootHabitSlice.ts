/**
 * Root Habit Slice - Zustand State Management
 *
 * Manages state for the 30-day challenge feature
 */

import { StateCreator } from 'zustand';
import type { RootHabitCheckIn, RootHabitProgress } from '@/types/rootHabit';
import { RootHabitService } from '@/services/supabase/rootHabit.service';
import { AchievementsService } from '@/services/supabase/achievements.service';

export interface RootHabitSlice {
  progress: RootHabitProgress | null;
  checkIns: RootHabitCheckIn[];
  rootHabitLoading: boolean;
  rootHabitError: string | null;
  canCheckIn: boolean;

  // Actions
  loadProgress: () => Promise<void>;
  checkIn: () => Promise<{ xpEarned: number }>;
  checkInDay: (dayNumber: number) => Promise<void>;
  deleteCheckIn: (dayNumber: number) => Promise<void>;
  resetChallenge: () => Promise<void>;
  refreshCanCheckIn: () => Promise<void>;
}

export const createRootHabitSlice: StateCreator<RootHabitSlice> = (set) => ({
  progress: null,
  checkIns: [],
  rootHabitLoading: false,
  rootHabitError: null,
  canCheckIn: false,

  loadProgress: async () => {
    try {
      set({ rootHabitLoading: true, rootHabitError: null });

      const [progress, checkIns, canCheckIn] = await Promise.all([
        RootHabitService.getProgress(),
        RootHabitService.getCheckIns(),
        RootHabitService.canCheckInToday(),
      ]);

      set({
        progress,
        checkIns,
        canCheckIn,
        rootHabitLoading: false,
      });
    } catch (error) {
      console.error('Error loading root habit progress:', error);
      set({
        rootHabitError: error instanceof Error ? error.message : 'Failed to load progress',
        rootHabitLoading: false,
      });
    }
  },

  checkIn: async () => {
    try {
      set({ rootHabitLoading: true, rootHabitError: null });

      const { xpEarned } = await RootHabitService.checkIn();

      // Check and unlock achievements automatically
      try {
        const achievementResult = await AchievementsService.checkAndUnlockAchievements();
        if (achievementResult.newly_unlocked > 0) {
          console.log(`🎉 Unlocked ${achievementResult.newly_unlocked} achievement(s)!`, achievementResult.achievements_unlocked);
        }
      } catch (err) {
        console.error('Error checking achievements:', err);
      }

      // Reload progress after check-in
      const [progress, checkIns, canCheckIn] = await Promise.all([
        RootHabitService.getProgress(),
        RootHabitService.getCheckIns(),
        RootHabitService.canCheckInToday(),
      ]);

      set({
        progress,
        checkIns,
        canCheckIn,
        rootHabitLoading: false,
      });

      return { xpEarned };
    } catch (error) {
      console.error('Error checking in:', error);
      set({
        rootHabitError: error instanceof Error ? error.message : 'Failed to check in',
        rootHabitLoading: false,
      });
      throw error;
    }
  },

  checkInDay: async (dayNumber: number) => {
    try {
      set({ rootHabitLoading: true, rootHabitError: null });

      await RootHabitService.checkInDay(dayNumber);

      // Reload progress after check-in
      const [progress, checkIns, canCheckIn] = await Promise.all([
        RootHabitService.getProgress(),
        RootHabitService.getCheckIns(),
        RootHabitService.canCheckInToday(),
      ]);

      set({
        progress,
        checkIns,
        canCheckIn,
        rootHabitLoading: false,
      });
    } catch (error) {
      console.error('Error checking in day:', error);
      set({
        rootHabitError: error instanceof Error ? error.message : 'Failed to check in day',
        rootHabitLoading: false,
      });
      throw error;
    }
  },

  deleteCheckIn: async (dayNumber: number) => {
    try {
      set({ rootHabitLoading: true, rootHabitError: null });

      await RootHabitService.deleteCheckIn(dayNumber);

      // Reload progress after deletion
      const [progress, checkIns, canCheckIn] = await Promise.all([
        RootHabitService.getProgress(),
        RootHabitService.getCheckIns(),
        RootHabitService.canCheckInToday(),
      ]);

      set({
        progress,
        checkIns,
        canCheckIn,
        rootHabitLoading: false,
      });
    } catch (error) {
      console.error('Error deleting check-in:', error);
      set({
        rootHabitError: error instanceof Error ? error.message : 'Failed to delete check-in',
        rootHabitLoading: false,
      });
      throw error;
    }
  },

  resetChallenge: async () => {
    try {
      set({ rootHabitLoading: true, rootHabitError: null });

      await RootHabitService.resetChallenge();

      // Reload progress after reset
      const [progress, checkIns, canCheckIn] = await Promise.all([
        RootHabitService.getProgress(),
        RootHabitService.getCheckIns(),
        RootHabitService.canCheckInToday(),
      ]);

      set({
        progress,
        checkIns,
        canCheckIn,
        rootHabitLoading: false,
      });
    } catch (error) {
      console.error('Error resetting challenge:', error);
      set({
        rootHabitError: error instanceof Error ? error.message : 'Failed to reset challenge',
        rootHabitLoading: false,
      });
      throw error;
    }
  },

  refreshCanCheckIn: async () => {
    try {
      const canCheckIn = await RootHabitService.canCheckInToday();
      set({ canCheckIn });
    } catch (error) {
      console.error('Error refreshing check-in status:', error);
    }
  },
});
