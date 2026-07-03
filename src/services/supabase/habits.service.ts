/**
 * Habits Service - Supabase Implementation
 *
 * IMPORTANT: This service separates habit definition from completion state.
 * - habits table: habit definition (name, xp, life_area_id)
 * - habit_completions table: historical record of when habits were completed
 *
 * The "completed" field is NO LONGER stored in the habit itself.
 * Instead, we JOIN with habit_completions for today's date to determine current state.
 */

import { supabase } from '@/lib/supabase';
import type {
  Habit,
  HabitCompletion,
  CompleteHabitResult,
  UncompleteHabitResult,
  RelapseResult,
} from '@/types/habit';
import { HabitsServiceError, HABIT_ERROR_CODES } from '@/types/errors';
import { getAuthUserId, getTodayDateRange, getDateRange } from './utils';
import { formatDayKeyInTimeZone, getProfileTimezone } from './timezone';
import { mapHabitRowToHabit, mapHabitCompletionRowToHabitCompletion } from './mappers';
import { trackHabitCompletion } from './leaderboard.service';

/**
 * Extended Habit type that includes today's completion status
 * Use this type for UI components that need to display completion state
 */
export interface HabitWithCompletion extends Omit<Habit, 'completed' | 'completedAt'> {
  completedToday: boolean;
  completedAt?: Date;
  /** measurable: value logged today (if any) */
  todayValue?: number;
}

export class HabitsService {
  /**
   * Get all habits (without completion state)
   * Use getHabitsWithCompletions() if you need to show completion status
   */
  static async getHabits(): Promise<Habit[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

      if (error) {
        throw new HabitsServiceError(error.message, HABIT_ERROR_CODES.NOT_FOUND);
      }

      return data.map((row) => mapHabitRowToHabit(row, false, undefined));
    } catch (error) {
      if (error instanceof HabitsServiceError) throw error;
      console.error('Error in HabitsService.getHabits:', error);
      throw new HabitsServiceError(
        'Failed to get habits',
        HABIT_ERROR_CODES.NOT_FOUND
      );
    }
  }

  /**
   * Get all habits with today's completion status (recommended for UI)
   * This performs a LEFT JOIN with habit_completions for today
   */
  static async getHabitsWithCompletions(): Promise<HabitWithCompletion[]> {
    try {
      const userId = await getAuthUserId();
      const { start, end } = getTodayDateRange();

      // Get all habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

      if (habitsError) {
        throw new HabitsServiceError(habitsError.message);
      }

      // Get today's completions
      const { data: completions, error: completionsError } = await supabase
        .from('habit_completions')
        .select('habit_id, completed_at, value')
        .eq('user_id', userId)
        .gte('completed_at', start)
        .lte('completed_at', end);

      if (completionsError) {
        throw new HabitsServiceError(completionsError.message);
      }

      // Create a map of habit_id -> completion for O(1) lookup
      const completionMap = new Map(
        completions.map((c) => [
          c.habit_id,
          { at: new Date(c.completed_at), value: c.value ?? undefined },
        ])
      );

      // Map habits with completion status
      return habits.map((habit) => {
        const completion = completionMap.get(habit.id);
        const completedAt = completion?.at;
        return {
          ...mapHabitRowToHabit(habit, !!completedAt, completedAt),
          completedToday: !!completedAt,
          completedAt,
          todayValue: completion?.value,
        } as HabitWithCompletion;
      });
    } catch (error) {
      if (error instanceof HabitsServiceError) throw error;
      console.error('Error in HabitsService.getHabitsWithCompletions:', error);
      throw new HabitsServiceError('Failed to get habits with completions');
    }
  }

  /**
   * Add a new habit
   */
  static async addHabit(habit: Partial<Habit>): Promise<Habit> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          name: habit.name!,
          icon_name: habit.iconName!,
          xp: habit.xp!,
          life_area_id: habit.lifeArea!, // Now a UUID
          habit_type: habit.habitType || 'check',
          unit: habit.unit || null,
          daily_goal: habit.dailyGoal ?? null,
          color: habit.color || null,
          time_of_day: habit.timeOfDay || 'anytime',
          reminder_enabled: habit.reminderEnabled ?? false,
          // points is auto-calculated by trigger (xp * 0.5)
        })
        .select()
        .single();

      if (error) {
        throw new HabitsServiceError(
          error.message,
          HABIT_ERROR_CODES.CREATE_FAILED
        );
      }

      return mapHabitRowToHabit(data, false, undefined);
    } catch (error) {
      if (error instanceof HabitsServiceError) throw error;
      console.error('Error in HabitsService.addHabit:', error);
      throw new HabitsServiceError(
        'Failed to add habit',
        HABIT_ERROR_CODES.CREATE_FAILED
      );
    }
  }

  /**
   * Update an existing habit
   */
  static async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    try {
      const userId = await getAuthUserId();

      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.iconName !== undefined) dbUpdates.icon_name = updates.iconName;
      if (updates.xp !== undefined) {
        dbUpdates.xp = updates.xp;
        // points will be auto-recalculated by trigger
      }
      if (updates.lifeArea !== undefined) dbUpdates.life_area_id = updates.lifeArea;
      if (updates.habitType !== undefined) dbUpdates.habit_type = updates.habitType;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit || null;
      if (updates.dailyGoal !== undefined) dbUpdates.daily_goal = updates.dailyGoal ?? null;
      if (updates.color !== undefined) dbUpdates.color = updates.color || null;
      if (updates.timeOfDay !== undefined) dbUpdates.time_of_day = updates.timeOfDay;
      if (updates.reminderEnabled !== undefined) dbUpdates.reminder_enabled = updates.reminderEnabled;

      const { data, error } = await supabase
        .from('habits')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new HabitsServiceError(
          error.message,
          HABIT_ERROR_CODES.UPDATE_FAILED
        );
      }

      return mapHabitRowToHabit(data, false, undefined);
    } catch (error) {
      if (error instanceof HabitsServiceError) throw error;
      console.error('Error in HabitsService.updateHabit:', error);
      throw new HabitsServiceError(
        'Failed to update habit',
        HABIT_ERROR_CODES.UPDATE_FAILED
      );
    }
  }

  /**
   * Delete a habit
   * Note: Completions are preserved via CASCADE behavior
   */
  static async deleteHabit(id: string): Promise<boolean> {
    try {
      const userId = await getAuthUserId();

      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw new HabitsServiceError(
          error.message,
          HABIT_ERROR_CODES.DELETE_FAILED
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HabitsServiceError) throw error;
      console.error('Error in HabitsService.deleteHabit:', error);
      throw new HabitsServiceError(
        'Failed to delete habit',
        HABIT_ERROR_CODES.DELETE_FAILED
      );
    }
  }

  /**
   * Complete a habit (mark as done for today) via the complete_habit v2 RPC.
   * The server atomically: inserts the completion (with measurable value),
   * applies the streak bonus + soft daily XP cap, updates points/XP/level,
   * updates the life area and refreshes the streak.
   *
   * Returns the full sync payload so the store can update without refetching.
   *
   * @throws {HabitsServiceError} if already completed or operation fails
   */
  static async completeHabit(
    habitId: string,
    value?: number
  ): Promise<CompleteHabitResult> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase.rpc('complete_habit', {
        p_habit_id: habitId,
        p_value: value ?? undefined,
      });

      if (error) {
        if (error.message.includes('already completed')) {
          throw new HabitsServiceError(
            'Habit already completed today',
            HABIT_ERROR_CODES.ALREADY_COMPLETED
          );
        }
        throw new HabitsServiceError(error.message);
      }

      const result = data as unknown as CompleteHabitResult;

      // Track completion in weekly leaderboard (non-blocking).
      // Uses the XP actually awarded (bonus/cap applied server-side).
      trackHabitCompletion(
        userId,
        result.xp_awarded,
        result.points_awarded
      ).catch((err) => {
        console.warn('Failed to track habit completion in leaderboard:', err);
      });

      return result;
    } catch (error) {
      if (error instanceof HabitsServiceError) throw error;
      console.error('Error in HabitsService.completeHabit:', error);
      throw new HabitsServiceError('Failed to complete habit');
    }
  }

  /**
   * Uncomplete a habit (remove today's completion) via uncomplete_habit v2.
   * Reverts the exact XP/points awarded and refreshes the streak server-side.
   *
   * @throws {HabitsServiceError} if not completed today or operation fails
   */
  static async uncompleteHabit(habitId: string): Promise<UncompleteHabitResult> {
    try {
      const { data, error } = await supabase.rpc('uncomplete_habit', {
        p_habit_id: habitId,
      });

      if (error) {
        if (error.message.includes('not found')) {
          throw new HabitsServiceError(
            'Habit not completed today',
            HABIT_ERROR_CODES.COMPLETION_NOT_FOUND
          );
        }
        throw new HabitsServiceError(error.message);
      }

      return data as unknown as UncompleteHabitResult;
    } catch (error) {
      if (error instanceof HabitsServiceError) throw error;
      console.error('Error in HabitsService.uncompleteHabit:', error);
      throw new HabitsServiceError('Failed to uncomplete habit');
    }
  }

  /**
   * Record a relapse for a quit-type habit via the record_relapse RPC.
   * Reverts today's completion if it exists and persists the relapse event.
   */
  static async recordRelapse(habitId: string): Promise<RelapseResult> {
    try {
      const { data, error } = await supabase.rpc('record_relapse', {
        p_habit_id: habitId,
      });

      if (error) {
        throw new HabitsServiceError(error.message);
      }

      return data as unknown as RelapseResult;
    } catch (error) {
      if (error instanceof HabitsServiceError) throw error;
      console.error('Error in HabitsService.recordRelapse:', error);
      throw new HabitsServiceError('Failed to record relapse');
    }
  }

  /**
   * Get completed habits for today
   */
  static async getCompletedHabitsToday(): Promise<HabitWithCompletion[]> {
    const habits = await this.getHabitsWithCompletions();
    return habits.filter((h) => h.completedToday);
  }

  /**
   * Get total XP earned today
   */
  static async getTotalXPEarnedToday(): Promise<number> {
    try {
      const userId = await getAuthUserId();
      const { start, end } = getTodayDateRange();

      const { data, error } = await supabase
        .from('habit_completions')
        .select('xp_earned')
        .eq('user_id', userId)
        .gte('completed_at', start)
        .lte('completed_at', end);

      if (error) {
        console.error('Error getting total XP:', error);
        return 0;
      }

      return data.reduce((sum, c) => sum + c.xp_earned, 0);
    } catch (error) {
      console.error('Error in HabitsService.getTotalXPEarnedToday:', error);
      return 0;
    }
  }

  /**
   * Get habit completions for a specific date
   */
  static async getCompletionsByDate(date: Date): Promise<HabitCompletion[]> {
    try {
      const userId = await getAuthUserId();

      const { start, end } = getDateRange(date);

      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', start)
        .lte('completed_at', end);

      if (error) {
        throw new HabitsServiceError(error.message);
      }

      return data.map(mapHabitCompletionRowToHabitCompletion);
    } catch (error) {
      console.error('Error in HabitsService.getCompletionsByDate:', error);
      return [];
    }
  }

  /**
   * Get a habit's completion history grouped by local day.
   * Powers the contribution heatmap and per-habit analytics.
   *
   * @param habitId  the habit to fetch
   * @param days     how far back to look (default 365)
   */
  static async getHabitHistory(
    habitId: string,
    days: number = 365
  ): Promise<import('@/types/habit').HabitDayLog[]> {
    try {
      const userId = await getAuthUserId();
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await supabase
        .from('habit_completions')
        .select('completed_at, value')
        .eq('user_id', userId)
        .eq('habit_id', habitId)
        .gte('completed_at', since.toISOString())
        .order('completed_at');

      if (error) {
        console.error('Error getting habit history:', error);
        return [];
      }

      // Aggregate by YYYY-MM-DD in the user's stored timezone (matches backend)
      const tz = getProfileTimezone();
      const map = new Map<string, { count: number; value: number }>();
      for (const row of data) {
        const key = formatDayKeyInTimeZone(tz, new Date(row.completed_at));
        const cur = map.get(key) || { count: 0, value: 0 };
        cur.count += 1;
        cur.value += Number(row.value || 0);
        map.set(key, cur);
      }

      return Array.from(map.entries())
        .map(([date, v]) => ({ date, count: v.count, value: v.value }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error in HabitsService.getHabitHistory:', error);
      return [];
    }
  }

  /**
   * DEPRECATED: toggleHabit is replaced by completeHabit/uncompleteHabit
   */
  static async toggleHabit(id: string, completed: boolean): Promise<boolean> {
    console.warn(
      'HabitsService.toggleHabit is deprecated. Use completeHabit() or uncompleteHabit() instead.'
    );
    if (completed) {
      await this.completeHabit(id);
    } else {
      await this.uncompleteHabit(id);
    }
    return true;
  }

  /**
   * DEPRECATED: resetDailyHabits is no longer needed
   * Completion state is stored separately in habit_completions table
   */
  static async resetDailyHabits(): Promise<boolean> {
    console.warn(
      'HabitsService.resetDailyHabits is deprecated. Completion state is date-based in habit_completions table.'
    );
    return true;
  }

  /**
   * DEPRECATED: Use getCompletedHabitsToday() instead
   */
  static async getCompletedHabits(): Promise<Habit[]> {
    console.warn(
      'HabitsService.getCompletedHabits is deprecated. Use getCompletedHabitsToday() instead.'
    );
    const completed = await this.getCompletedHabitsToday();
    return completed as any; // Type compatibility
  }

  /**
   * DEPRECATED: Use getTotalXPEarnedToday() instead
   */
  static async getTotalXPEarned(): Promise<number> {
    console.warn(
      'HabitsService.getTotalXPEarned is deprecated. Use getTotalXPEarnedToday() instead.'
    );
    return this.getTotalXPEarnedToday();
  }
}
