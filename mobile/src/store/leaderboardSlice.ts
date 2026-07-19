/**
 * Leaderboard Slice
 * Manages weekly leaderboard and competitive rankings
 */

import type { StateCreator } from 'zustand';
import type { LeaderboardEntry, WeeklyLeaderboard } from '@/types/social';
import type { WeeklyComparison } from '@/types/community';
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
  weeklyComparison: WeeklyComparison | null;
  allTimeLeaderboard: LeaderboardEntry[];
  allTimeLoading: boolean;
  leaderboardLoading: boolean;
  leaderboardError: string | null;

  // Actions
  loadWeeklyLeaderboard: (userId: string, limit?: number, weekStartDate?: Date) => Promise<void>;
  loadUserWeeklyStats: (userId: string, weekStartDate?: Date) => Promise<void>;
  loadWeeklyComparison: (userId: string) => Promise<void>;
  loadAllTimeLeaderboard: (userId: string, limit?: number) => Promise<void>;
  refreshLeaderboard: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const createLeaderboardSlice: StateCreator<LeaderboardSlice> = (set, get) => ({
  // Initial state
  weeklyLeaderboard: null,
  userRank: 0,
  userWeeklyStats: null,
  weeklyComparison: null,
  allTimeLeaderboard: [],
  allTimeLoading: false,
  leaderboardLoading: false,
  leaderboardError: null,

  // Load weekly leaderboard
  loadWeeklyLeaderboard: async (
    userId: string,
    limit: number = 50,
    weekStartDate?: Date
  ) => {
    set({ leaderboardLoading: true, leaderboardError: null });
    try {
      const leaderboard = await LeaderboardService.getWeeklyLeaderboard(
        userId,
        limit,
        weekStartDate
      );

      set({
        weeklyLeaderboard: leaderboard,
        userRank: leaderboard.userRank,
        leaderboardLoading: false,
      });
    } catch (error: any) {
      console.error('Error loading weekly leaderboard:', error);
      set({
        leaderboardError: error.message || 'Failed to load weekly leaderboard',
        leaderboardLoading: false,
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

  // Load current vs previous week deltas (supplementary — errors stay silent)
  loadWeeklyComparison: async (userId: string) => {
    try {
      const comparison = await LeaderboardService.getWeeklyComparison(userId);
      set({ weeklyComparison: comparison });
    } catch (error: any) {
      console.error('Error loading weekly comparison:', error);
    }
  },

  // Load the all-time ranking ("Histórico")
  loadAllTimeLeaderboard: async (userId: string, limit: number = 50) => {
    set({ allTimeLoading: true });
    try {
      const entries = await LeaderboardService.getAllTimeLeaderboard(userId, limit);
      set({ allTimeLeaderboard: entries, allTimeLoading: false });
    } catch (error: any) {
      console.error('Error loading all-time leaderboard:', error);
      set({ allTimeLoading: false });
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
    set({ leaderboardError: null });
  },
});
