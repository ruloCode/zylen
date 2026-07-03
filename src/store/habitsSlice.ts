import { StateCreator } from 'zustand';
import { Habit, Streak } from '@/types';
import type { StreakSnapshot } from '@/types/habit';
import {
  HabitsService,
  HabitWithCompletion,
} from '@/services/supabase/habits.service';
import { AchievementsService } from '@/services/supabase/achievements.service';
import type { AppStore } from './types';

export interface HabitToggleResult {
  xpEarned: number;
  pointsEarned: number;
  /** streak bonus applied server-side (1.0 = none, up to 2.0) */
  streakMultiplier?: number;
  /** true when the soft daily XP cap reduced the award */
  capped?: boolean;
  leveledUp?: boolean;
  newLevel?: number;
  areaLevelUp?: {
    area: string;
    newLevel: number;
  };
}

/** Map the RPC streak snapshot to the app Streak type */
function mapSnapshotToStreak(snapshot: StreakSnapshot): Streak {
  return {
    currentStreak: snapshot.current_streak,
    weeklyStreak: snapshot.last_seven_days.filter(Boolean).length,
    longestStreak: snapshot.longest_streak,
    lastSevenDays: snapshot.last_seven_days,
    lastCompletionDate: snapshot.last_completion_date
      ? new Date(snapshot.last_completion_date)
      : undefined,
  };
}

export interface HabitsSlice {
  habits: HabitWithCompletion[];
  habitsLoading: boolean;
  habitsError: string | null;

  // Actions
  loadHabits: () => Promise<void>;
  addHabit: (habit: Partial<Habit>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabit: (id: string, value?: number) => Promise<HabitToggleResult>;
  uncompleteHabit: (id: string) => Promise<void>;
  /** quit habits: revert today's completion (if any) and persist the relapse */
  recordRelapse: (id: string) => Promise<void>;
  getTotalXPEarned: () => Promise<number>;
  getHabitHistory: (
    id: string,
    days?: number
  ) => Promise<import('@/types/habit').HabitDayLog[]>;
}

export const createHabitsSlice: StateCreator<AppStore, [], [], HabitsSlice> = (
  set,
  get
) => ({
  habits: [],
  habitsLoading: false,
  habitsError: null,

  loadHabits: async () => {
    try {
      set({ habitsLoading: true, habitsError: null });

      const habits = await HabitsService.getHabitsWithCompletions();

      set({ habits, habitsLoading: false });
    } catch (error) {
      console.error('Error loading habits:', error);
      set({
        habitsError: error instanceof Error ? error.message : 'Failed to load habits',
        habitsLoading: false,
      });
    }
  },

  addHabit: async (habit: Partial<Habit>) => {
    try {
      set({ habitsLoading: true, habitsError: null });

      // Validate that lifeArea is provided (now required)
      if (!habit.lifeArea) {
        throw new Error('Habit must have a life area assigned');
      }

      const newHabit = await HabitsService.addHabit(habit);

      // Reload habits to get updated completion status
      const habits = await HabitsService.getHabitsWithCompletions();

      set({ habits, habitsLoading: false });
    } catch (error) {
      console.error('Error adding habit:', error);
      set({
        habitsError: error instanceof Error ? error.message : 'Failed to add habit',
        habitsLoading: false,
      });
      throw error; // Re-throw so UI can handle
    }
  },

  updateHabit: async (id: string, updates: Partial<Habit>) => {
    try {
      set({ habitsLoading: true, habitsError: null });

      await HabitsService.updateHabit(id, updates);

      // Reload habits to get updated data
      const habits = await HabitsService.getHabitsWithCompletions();

      set({ habits, habitsLoading: false });
    } catch (error) {
      console.error('Error updating habit:', error);
      set({
        habitsError: error instanceof Error ? error.message : 'Failed to update habit',
        habitsLoading: false,
      });
      throw error;
    }
  },

  deleteHabit: async (id: string) => {
    try {
      set({ habitsLoading: true, habitsError: null });

      await HabitsService.deleteHabit(id);

      // Remove from state
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
        habitsLoading: false,
      }));
    } catch (error) {
      console.error('Error deleting habit:', error);
      set({
        habitsError: error instanceof Error ? error.message : 'Failed to delete habit',
        habitsLoading: false,
      });
      throw error;
    }
  },

  completeHabit: async (id: string, value?: number): Promise<HabitToggleResult> => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) {
      throw new Error('Habit not found');
    }

    // Optimistic update: only this habit's card re-renders. Never toggle a
    // loading flag here — full-screen loaders must not replace the page.
    const previousToday = {
      completedToday: habit.completedToday,
      completedAt: habit.completedAt,
      todayValue: habit.todayValue,
    };
    const completedAt = new Date();
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id
          ? { ...h, completedToday: true, completedAt, todayValue: value ?? h.todayValue }
          : h
      ),
      habitsError: null,
    }));

    try {
      // Complete habit via RPC v2: the server applies the streak bonus and
      // the soft daily XP cap, updates level/streak/life area atomically and
      // returns everything needed to sync the store — no refetch.
      const result = await HabitsService.completeHabit(id, value);

      const user = get().user;
      set((state) => ({
        streak: mapSnapshotToStreak(result.streak),
        ...(user
          ? {
              user: {
                ...user,
                points: result.new_points,
                totalXPEarned: result.new_total_xp,
                level: result.new_level,
              },
            }
          : {}),
        lifeAreas: state.lifeAreas.map((area) =>
          area.id === result.life_area.id
            ? { ...area, totalXP: result.life_area.total_xp, level: result.life_area.level }
            : area
        ),
      }));

      // Let the Guardian celebrate today's level-up on the Dashboard.
      if (result.leveled_up) {
        get().setLastLevelUp(result.new_level);
      }

      // Check achievements in the background; never block the completion.
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

      return {
        xpEarned: result.xp_awarded,
        pointsEarned: result.points_awarded,
        streakMultiplier: result.streak_multiplier,
        capped: result.capped,
        leveledUp: result.leveled_up,
        newLevel: result.new_level,
        ...(result.life_area.leveled_up
          ? {
              areaLevelUp: {
                area: result.life_area.id,
                newLevel: result.life_area.level,
              },
            }
          : {}),
      };
    } catch (error) {
      console.error('Error completing habit:', error);
      // Rollback the optimistic update
      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === id ? { ...h, ...previousToday } : h
        ),
        habitsError:
          error instanceof Error ? error.message : 'Failed to complete habit',
      }));
      throw error;
    }
  },

  uncompleteHabit: async (id: string) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) {
      throw new Error('Habit not found');
    }

    // Optimistic update (see completeHabit).
    const previousToday = {
      completedToday: habit.completedToday,
      completedAt: habit.completedAt,
      todayValue: habit.todayValue,
    };
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id
          ? { ...h, completedToday: false, completedAt: undefined, todayValue: undefined }
          : h
      ),
      habitsError: null,
    }));

    try {
      // Uncomplete habit via RPC v2: reverts the exact XP/points awarded and
      // refreshes the streak server-side; sync the store from the payload.
      const result = await HabitsService.uncompleteHabit(id);

      const user = get().user;
      set((state) => ({
        streak: mapSnapshotToStreak(result.streak),
        ...(user
          ? {
              user: {
                ...user,
                points: result.new_points,
                totalXPEarned: result.new_total_xp,
                level: result.new_level,
              },
            }
          : {}),
        lifeAreas: state.lifeAreas.map((area) =>
          area.id === result.life_area.id
            ? { ...area, totalXP: result.life_area.total_xp, level: result.life_area.level }
            : area
        ),
      }));
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === id ? { ...h, ...previousToday } : h
        ),
        habitsError:
          error instanceof Error ? error.message : 'Failed to uncomplete habit',
      }));
      throw error;
    }
  },

  recordRelapse: async (id: string) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) {
      throw new Error('Habit not found');
    }

    // Optimistic: clear today's completion on the card.
    const previousToday = {
      completedToday: habit.completedToday,
      completedAt: habit.completedAt,
      todayValue: habit.todayValue,
    };
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id
          ? { ...h, completedToday: false, completedAt: undefined, todayValue: undefined }
          : h
      ),
      habitsError: null,
    }));

    try {
      const result = await HabitsService.recordRelapse(id);

      const user = get().user;
      const reverted = result.reverted_details;
      set((state) => ({
        streak: mapSnapshotToStreak(result.streak),
        ...(user && reverted
          ? {
              user: {
                ...user,
                points: reverted.new_points,
                totalXPEarned: reverted.new_total_xp,
                level: reverted.new_level,
              },
            }
          : {}),
        ...(reverted
          ? {
              lifeAreas: state.lifeAreas.map((area) =>
                area.id === reverted.life_area.id
                  ? { ...area, totalXP: reverted.life_area.total_xp, level: reverted.life_area.level }
                  : area
              ),
            }
          : {}),
      }));
    } catch (error) {
      console.error('Error recording relapse:', error);
      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === id ? { ...h, ...previousToday } : h
        ),
        habitsError:
          error instanceof Error ? error.message : 'Failed to record relapse',
      }));
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

  getHabitHistory: async (id: string, days = 365) => {
    try {
      return await HabitsService.getHabitHistory(id, days);
    } catch (error) {
      console.error('Error getting habit history:', error);
      return [];
    }
  },
});
