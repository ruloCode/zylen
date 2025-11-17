/**
 * Leaderboard Slice
 * Manages weekly leaderboard and competitive rankings
 */

import type { StateCreator } from 'zustand';
import type { LeaderboardEntry, WeeklyLeaderboard } from '@/types/social';
import * as LeaderboardService from '@/services/supabase/leaderboard.service';

export interface LeaderboardSlice {
  // State
  weeklyLeaderboard: WeeklyLeaderboard | null;
  userRank: number;
  userWeeklyStats: {
    weeklyXPEarned: number;
    weeklyPointsEarned: number;
    habitsCompleted: number;
  } | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadWeeklyLeaderboard: (userId: string, limit?: number, weekStartDate?: Date) => Promise<void>;
  loadUserWeeklyStats: (userId: string, weekStartDate?: Date) => Promise<void>;
  refreshLeaderboard: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const createLeaderboardSlice: StateCreator<LeaderboardSlice> = (set, get) => ({
  // Initial state
  weeklyLeaderboard: null,
  userRank: 0,
  userWeeklyStats: null,
  isLoading: false,
  error: null,

  // Load weekly leaderboard
  loadWeeklyLeaderboard: async (
    userId: string,
    limit: number = 50,
    weekStartDate?: Date
  ) => {
    set({ isLoading: true, error: null });
    try {
      const leaderboard = await LeaderboardService.getWeeklyLeaderboard(
        userId,
        limit,
        weekStartDate
      );

      set({
        weeklyLeaderboard: leaderboard,
        userRank: leaderboard.userRank,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Error loading weekly leaderboard:', error);
      set({
        error: error.message || 'Failed to load weekly leaderboard',
        isLoading: false,
        weeklyLeaderboard: null,
      });
    }
  },

  // Load user's weekly stats
  loadUserWeeklyStats: async (userId: string, weekStartDate?: Date) => {
    try {
      const stats = await LeaderboardService.getUserWeeklyStats(userId, weekStartDate);

      if (stats) {
        set({
          userWeeklyStats: {
            weeklyXPEarned: stats.weeklyXPEarned,
            weeklyPointsEarned: stats.weeklyPointsEarned,
            habitsCompleted: stats.habitsCompleted,
          },
          userRank: stats.rank,
        });
      }
    } catch (error: any) {
      console.error('Error loading user weekly stats:', error);
      // Don't set error state for stats - it's supplementary data
    }
  },

  // Refresh leaderboard (reload with current settings)
  refreshLeaderboard: async (userId: string) => {
    const currentLeaderboard = get().weeklyLeaderboard;
    const limit = currentLeaderboard?.entries.length || 50;
    const weekStartDate = currentLeaderboard?.weekStartDate;

    await get().loadWeeklyLeaderboard(userId, limit, weekStartDate);
    await get().loadUserWeeklyStats(userId, weekStartDate);
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
});
