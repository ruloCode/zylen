/**
 * Community Slice
 * Activity feed, shared missions and ally stats for the Aliados tab.
 * Each section keeps its own loading/error so the UI degrades per-section.
 */

import type { StateCreator } from 'zustand';
import type {
  ActivityEvent,
  AllyStats,
  MissionCheckinResult,
  SharedMission,
} from '@/types/community';
import * as CommunityService from '@/services/supabase/community.service';
import type { AppStore } from './types';

const ACTIVITY_PAGE_SIZE = 30;

export interface CommunitySlice {
  // State
  activityFeed: ActivityEvent[];
  activityHasMore: boolean;
  activityLoading: boolean;
  activityError: string | null;
  sharedMissions: SharedMission[];
  missionsLoading: boolean;
  missionsError: string | null;
  allyStats: AllyStats | null;
  allyStatsLoading: boolean;
  allyStatsError: string | null;

  // Actions
  loadActivityFeed: () => Promise<void>;
  loadMoreActivity: () => Promise<void>;
  loadSharedMissions: () => Promise<void>;
  joinMission: (missionId: string) => Promise<void>;
  checkinMission: (missionId: string) => Promise<MissionCheckinResult>;
  loadAllyStats: () => Promise<void>;
  loadAlliesTab: () => Promise<void>;
}

export const createCommunitySlice: StateCreator<AppStore, [], [], CommunitySlice> = (
  set,
  get
) => ({
  // Initial state
  activityFeed: [],
  activityHasMore: false,
  activityLoading: false,
  activityError: null,
  sharedMissions: [],
  missionsLoading: false,
  missionsError: null,
  allyStats: null,
  allyStatsLoading: false,
  allyStatsError: null,

  loadActivityFeed: async () => {
    set({ activityLoading: true, activityError: null });
    try {
      const events = await CommunityService.getFriendActivity(ACTIVITY_PAGE_SIZE);
      set({
        activityFeed: events,
        activityHasMore: events.length === ACTIVITY_PAGE_SIZE,
        activityLoading: false,
      });
    } catch (error: any) {
      console.error('Error loading activity feed:', error);
      set({
        activityError: error.message || 'Failed to load activity feed',
        activityLoading: false,
      });
    }
  },

  loadMoreActivity: async () => {
    const { activityFeed, activityLoading } = get();
    if (activityLoading || activityFeed.length === 0) return;

    set({ activityLoading: true });
    try {
      const cursor = activityFeed[activityFeed.length - 1]?.createdAt;
      const events = await CommunityService.getFriendActivity(
        ACTIVITY_PAGE_SIZE,
        cursor
      );
      set((state) => ({
        activityFeed: [...state.activityFeed, ...events],
        activityHasMore: events.length === ACTIVITY_PAGE_SIZE,
        activityLoading: false,
      }));
    } catch (error: any) {
      console.error('Error loading more activity:', error);
      set({ activityLoading: false });
    }
  },

  loadSharedMissions: async () => {
    set({ missionsLoading: true, missionsError: null });
    try {
      const missions = await CommunityService.getSharedMissions();
      set({ sharedMissions: missions, missionsLoading: false });
    } catch (error: any) {
      console.error('Error loading shared missions:', error);
      set({
        missionsError: error.message || 'Failed to load missions',
        missionsLoading: false,
      });
    }
  },

  joinMission: async (missionId: string) => {
    // Optimistic: flip the card to joined right away
    set((state) => ({
      sharedMissions: state.sharedMissions.map((m) =>
        m.id === missionId
          ? { ...m, isJoined: true, participantCount: m.participantCount + 1 }
          : m
      ),
    }));
    try {
      await CommunityService.joinSharedMission(missionId);
      // Refresh to pick up the avatar stack with self included
      await get().loadSharedMissions();
    } catch (error: any) {
      console.error('Error joining mission:', error);
      // Roll back optimistic state
      await get().loadSharedMissions();
      throw error;
    }
  },

  checkinMission: async (missionId: string) => {
    const result = await CommunityService.checkinSharedMission(missionId);

    if (result.ok) {
      set((state) => ({
        sharedMissions: state.sharedMissions.map((m) =>
          m.id === missionId
            ? {
                ...m,
                myDaysCompleted: result.daysCompleted,
                checkedInToday: true,
                isCompleted: result.missionCompleted || m.isCompleted,
              }
            : m
        ),
      }));

      // Mission completed → the backend granted XP/points; sync the profile
      if (result.missionCompleted) {
        const user = get().user;
        if (user && result.newTotalXP !== undefined) {
          set({
            user: {
              ...user,
              points: result.newPoints ?? user.points,
              totalXPEarned: result.newTotalXP,
              level: result.newLevel ?? user.level,
            },
          });
        }
      }
    }

    return result;
  },

  loadAllyStats: async () => {
    set({ allyStatsLoading: true, allyStatsError: null });
    try {
      const stats = await CommunityService.getAllyStats();
      set({ allyStats: stats, allyStatsLoading: false });
    } catch (error: any) {
      console.error('Error loading ally stats:', error);
      set({
        allyStatsError: error.message || 'Failed to load ally stats',
        allyStatsLoading: false,
      });
    }
  },

  // Everything the Aliados tab needs, in parallel (each with its own error)
  loadAlliesTab: async () => {
    await Promise.all([
      get().loadActivityFeed(),
      get().loadSharedMissions(),
      get().loadAllyStats(),
    ]);
  },
});
