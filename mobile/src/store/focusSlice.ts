/**
 * Focus Slice - Zustand State Management
 *
 * Gems, session lifecycle and vault stats for the Pomodoro feature.
 * completeFocusSession syncs user/life-area state from the RPC payload
 * (like habitsSlice.completeHabit); when the dev adapter omits profile
 * totals it falls back to local increments.
 */

import { StateCreator } from 'zustand';
import type {
  ActiveFocusSession,
  ClaimDailyRewardResult,
  CompleteFocusSessionResult,
  FocusBreakReason,
  FocusGem,
  FocusGemFormData,
  FocusSpeciesState,
  FocusStats,
  GemSpecies,
} from '@/types/focus';
import { FocusService } from '@/services/supabase/focus.service';
import { AchievementsService } from '@/services/supabase/achievements.service';
import { getAreaLevelFromXP, getLevelFromXP } from '@/utils/xp';
import i18n from '@/services/i18n';

const shouldSkipAuth =
  ENV.SKIP_AUTH;
import {
  clearPersistedFocusSession,
  persistFocusSession,
} from '@/features/focus/utils/focusStorage';
import type { AppStore } from './types';
import { ENV } from '@/lib/env';

export interface FocusSlice {
  focusGems: FocusGem[];
  focusSpecies: FocusSpeciesState[];
  focusStats: FocusStats | null;
  activeFocusSession: ActiveFocusSession | null;
  focusLoading: boolean;
  focusError: string | null;

  // Actions
  loadFocusData: () => Promise<void>;
  createFocusGem: (form: FocusGemFormData) => Promise<FocusGem>;
  archiveFocusGem: (gemId: string) => Promise<void>;
  unlockFocusSpecies: (species: GemSpecies) => Promise<void>;
  startFocusSession: (gemId: string, durationMinutes: number) => Promise<void>;
  completeFocusSession: () => Promise<CompleteFocusSessionResult>;
  /** Claim today's daily-challenge reward (once per day, gated on the minutes goal). */
  claimDailyFocusReward: () => Promise<ClaimDailyRewardResult>;
  breakFocusSession: (reason: FocusBreakReason) => Promise<void>;
  /** Rehydrate a persisted running session (restore-on-mount) */
  setActiveFocusSession: (session: ActiveFocusSession | null) => void;
  updateFocusPause: (
    pausedAccumMs: number,
    pauseStartedAt: number | null
  ) => void;
}

/** In-flight guard: never let a double-tap/reload settle the same session twice. */
let settlingSessionId: string | null = null;

export const createFocusSlice: StateCreator<AppStore, [], [], FocusSlice> = (
  set,
  get
) => ({
  focusGems: [],
  focusSpecies: [],
  focusStats: null,
  activeFocusSession: null,
  focusLoading: false,
  focusError: null,

  loadFocusData: async () => {
    try {
      set({ focusLoading: true, focusError: null });
      const [gems, stats, species] = await Promise.all([
        FocusService.getGems(),
        FocusService.getStats(),
        FocusService.getSpeciesState(),
      ]);

      // Invariant: the user always has at least one gem ready to grow, so
      // the very first session needs zero setup.
      let allGems = gems;
      if (gems.length === 0) {
        try {
          const starter = await FocusService.createGem({
            name: i18n.t('focus.starterGem'),
            species: 'career',
          });
          allGems = [starter];
        } catch (starterError) {
          console.error('Error creating starter gem:', starterError);
        }
      }

      set({
        focusGems: allGems,
        focusStats: stats,
        focusSpecies: species,
        focusLoading: false,
      });
    } catch (error) {
      console.error('Error loading focus data:', error);
      set({
        focusError:
          error instanceof Error ? error.message : 'Failed to load focus data',
        focusLoading: false,
      });
    }
  },

  unlockFocusSpecies: async (species: GemSpecies) => {
    const result = await FocusService.unlockSpecies(species);

    set((state) => ({
      focusSpecies: state.focusSpecies.map((s) =>
        s.key === species ? { ...s, unlocked: true } : s
      ),
    }));

    const user = get().user;
    if (user) {
      const newPoints =
        result.newPoints ?? Math.max(0, user.points - result.pointsPaid);
      set({ user: { ...user, points: newPoints } });
    }
  },

  createFocusGem: async (form: FocusGemFormData) => {
    const gem = await FocusService.createGem(form);
    set((state) => ({ focusGems: [...state.focusGems, gem] }));
    return gem;
  },

  archiveFocusGem: async (gemId: string) => {
    await FocusService.archiveGem(gemId);
    set((state) => ({
      focusGems: state.focusGems.filter((g) => g.id !== gemId),
    }));
  },

  startFocusSession: async (gemId: string, durationMinutes: number) => {
    const gem = get().focusGems.find((g) => g.id === gemId);
    if (!gem) throw new Error('gem_not_found');

    const result = await FocusService.startSession(gemId, durationMinutes);

    const session: ActiveFocusSession = {
      sessionId: result.sessionId,
      gemId,
      gemName: gem.name,
      species: result.species,
      durationMs: durationMinutes * 60_000,
      startedAt: Date.now(),
      pausedAccumMs: 0,
      pauseStartedAt: null,
    };
    persistFocusSession(session);
    set({ activeFocusSession: session, focusError: null });
  },

  completeFocusSession: async () => {
    const session = get().activeFocusSession;
    if (!session) throw new Error('session_not_running');
    if (settlingSessionId === session.sessionId) {
      throw new Error('session_settling');
    }
    settlingSessionId = session.sessionId;

    try {
      const result = await FocusService.completeSession(session.sessionId);

      // The RPC settled the session either way — the local copy is done.
      clearPersistedFocusSession();
      set({ activeFocusSession: null });

      if (!result.broken) {
        const user = get().user;
        if (user) {
          const newTotalXP =
            result.newTotalXP ?? user.totalXPEarned + result.xpAwarded;
          const newPoints =
            result.newPoints ?? user.points + result.pointsAwarded;
          const newLevel = result.newLevel ?? getLevelFromXP(newTotalXP);
          set({
            user: {
              ...user,
              points: newPoints,
              totalXPEarned: newTotalXP,
              level: newLevel,
            },
          });
        }

        if (result.lifeArea) {
          const { id, totalXP, level } = result.lifeArea;
          set((state) => ({
            lifeAreas: state.lifeAreas.map((area) =>
              area.id === id ? { ...area, totalXP, level } : area
            ),
          }));
        } else {
          // Dev adapter path: bump the species' local life area directly.
          set((state) => ({
            lifeAreas: state.lifeAreas.map((area) => {
              if (area.id !== session.species) return area;
              const totalXP = area.totalXP + result.xpAwarded;
              return { ...area, totalXP, level: getAreaLevelFromXP(totalXP) };
            }),
          }));
        }

        if (!shouldSkipAuth) {
          AchievementsService.checkAndUnlockAchievements()
            .then((achievementResult) => {
              if (achievementResult.newly_unlocked > 0) {
                console.log(
                  `🎉 Unlocked ${achievementResult.newly_unlocked} achievement(s)!`,
                  achievementResult.achievements_unlocked
                );
              }
            })
            .catch((err) => console.error('Error checking achievements:', err));
        }
      }

      // Refresh vault stats in the background; species_counts is already fresh.
      FocusService.getStats()
        .then((stats) => set({ focusStats: stats }))
        .catch((err) => console.error('Error refreshing focus stats:', err));

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('session_not_running')) {
        // Someone (another tab, a previous attempt) already settled it.
        clearPersistedFocusSession();
        set({ activeFocusSession: null });
      } else {
        set({
          focusError:
            error instanceof Error ? error.message : 'Failed to complete session',
        });
      }
      throw error;
    } finally {
      settlingSessionId = null;
    }
  },

  claimDailyFocusReward: async () => {
    const result = await FocusService.claimDailyReward();
    if (!result.ok) return result;

    // Apply the reward to the profile (server totals when present, local
    // increments in the dev adapter — same fallback as completeFocusSession).
    const user = get().user;
    if (user) {
      const newTotalXP =
        result.newTotalXP ?? user.totalXPEarned + result.xpAwarded;
      const newPoints = result.newPoints ?? user.points + result.pointsAwarded;
      const newLevel = result.newLevel ?? getLevelFromXP(newTotalXP);
      set({
        user: {
          ...user,
          points: newPoints,
          totalXPEarned: newTotalXP,
          level: newLevel,
        },
      });
    }

    // Mark today's reward as claimed on the single source of truth (focusStats)
    // so the banner flips to its "claimed" state without a refetch.
    const stats = get().focusStats;
    if (stats) {
      set({ focusStats: { ...stats, todayRewardClaimed: true } });
    }

    return result;
  },

  breakFocusSession: async (reason: FocusBreakReason) => {
    const session = get().activeFocusSession;
    if (!session) return;
    if (settlingSessionId === session.sessionId) return;
    settlingSessionId = session.sessionId;

    try {
      await FocusService.breakSession(session.sessionId, reason);
    } catch (error) {
      // A broken session must never trap the user: log and clear anyway.
      console.error('Error breaking focus session:', error);
    } finally {
      settlingSessionId = null;
    }

    clearPersistedFocusSession();
    set({ activeFocusSession: null });

    FocusService.getStats()
      .then((stats) => set({ focusStats: stats }))
      .catch((err) => console.error('Error refreshing focus stats:', err));
  },

  setActiveFocusSession: (session) => {
    set({ activeFocusSession: session });
  },

  updateFocusPause: (pausedAccumMs, pauseStartedAt) => {
    const session = get().activeFocusSession;
    if (!session) return;
    const updated = { ...session, pausedAccumMs, pauseStartedAt };
    persistFocusSession(updated);
    set({ activeFocusSession: updated });
  },
});
