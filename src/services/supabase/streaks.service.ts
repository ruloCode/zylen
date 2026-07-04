/**
 * Streaks Service - Supabase Implementation
 *
 * Handles streak tracking using Supabase.
 * Streak record is auto-created on user signup via database trigger.
 */

import { supabase } from '@/lib/supabase';
import type { Streak, StreakData } from '@/types/streak';
import type { StreakSnapshot } from '@/types/habit';
import { StreaksServiceError, STREAK_ERROR_CODES } from '@/types/errors';
import { STREAK_CONFIG } from '@/constants';
import { getAuthUserId } from './utils';
import { mapStreakRowToStreak } from './mappers';

export class StreaksService {
  /**
   * Recompute the streak from habit_completions in the user's timezone.
   *
   * The stored `last_seven_days` array is only rewritten when a habit is
   * completed/uncompleted (via refresh_user_streak inside those RPCs). On a
   * fresh day where nothing has been completed yet, the stored array's last
   * slot still points at the previous active day. Calling this realigns the
   * array so index 6 is *today* — which the weekly strip relies on — and
   * recomputes the current streak (a streak ending yesterday stays alive).
   */
  static async refreshStreak(): Promise<Streak | null> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase.rpc('refresh_user_streak', {
        p_user_id: userId,
      });

      if (error) {
        throw new StreaksServiceError(
          error.message,
          STREAK_ERROR_CODES.UPDATE_FAILED
        );
      }

      const snapshot = data as unknown as StreakSnapshot;
      return {
        currentStreak: snapshot.current_streak,
        weeklyStreak: snapshot.last_seven_days.filter(Boolean).length,
        longestStreak: snapshot.longest_streak,
        lastSevenDays: snapshot.last_seven_days,
        lastCompletionDate: snapshot.last_completion_date
          ? new Date(snapshot.last_completion_date)
          : undefined,
      };
    } catch (error) {
      if (error instanceof StreaksServiceError) throw error;
      console.error('Error in StreaksService.refreshStreak:', error);
      throw new StreaksServiceError(
        'Failed to refresh streak',
        STREAK_ERROR_CODES.UPDATE_FAILED
      );
    }
  }

  /**
   * Get current user's streak data
   */
  static async getStreak(): Promise<Streak | null> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Streak not found - shouldn't happen if trigger works
          console.warn('Streak not found for authenticated user');
          return null;
        }
        throw new StreaksServiceError(error.message, STREAK_ERROR_CODES.NOT_FOUND);
      }

      return mapStreakRowToStreak(data);
    } catch (error) {
      if (error instanceof StreaksServiceError) throw error;
      console.error('Error in StreaksService.getStreak:', error);
      throw new StreaksServiceError(
        'Failed to get streak',
        STREAK_ERROR_CODES.NOT_FOUND
      );
    }
  }

  /**
   * Update streak for today
   * This should be called whenever habits are completed/uncompleted
   * @param completed Whether any habits were completed today
   */
  static async updateStreakForToday(completed: boolean): Promise<Streak> {
    try {
      const userId = await getAuthUserId();

      // Get current streak
      const { data: currentStreak, error: fetchError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        throw new StreaksServiceError(
          fetchError.message,
          STREAK_ERROR_CODES.NOT_FOUND
        );
      }

      // Update last seven days array (shift left, add today)
      const lastSevenDays = [...currentStreak.last_seven_days];
      lastSevenDays.shift(); // Remove oldest day
      lastSevenDays.push(completed); // Add today

      // Calculate current streak (consecutive days from the end)
      let currentStreakCount = 0;
      for (let i = lastSevenDays.length - 1; i >= 0; i--) {
        if (lastSevenDays[i]) {
          currentStreakCount++;
        } else {
          break;
        }
      }

      // Calculate longest streak
      const longestStreak = Math.max(
        currentStreak.longest_streak,
        currentStreakCount
      );

      // Update last completion date if completed
      const lastCompletionDate = completed
        ? new Date().toISOString()
        : currentStreak.last_completion_date;

      // Update in database
      const { data: updatedStreak, error: updateError } = await supabase
        .from('streaks')
        .update({
          last_seven_days: lastSevenDays,
          current_streak: currentStreakCount,
          longest_streak: longestStreak,
          last_completion_date: lastCompletionDate,
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        throw new StreaksServiceError(
          updateError.message,
          STREAK_ERROR_CODES.UPDATE_FAILED
        );
      }

      return mapStreakRowToStreak(updatedStreak);
    } catch (error) {
      if (error instanceof StreaksServiceError) throw error;
      console.error('Error in StreaksService.updateStreakForToday:', error);
      throw new StreaksServiceError(
        'Failed to update streak',
        STREAK_ERROR_CODES.UPDATE_FAILED
      );
    }
  }

  /**
   * Get streak bonus multiplier based on current streak
   * Returns a value between 1.0 and maxStreakBonus (default 2.0)
   */
  static async getStreakBonus(): Promise<number> {
    try {
      const streak = await this.getStreak();
      if (!streak) return 1.0;

      // Apply multiplier based on streak length (10% per day)
      const bonus = Math.min(
        1.0 + streak.currentStreak * 0.1,
        STREAK_CONFIG?.maxStreakBonus || 2.0
      );

      return bonus;
    } catch (error) {
      console.error('Error in StreaksService.getStreakBonus:', error);
      return 1.0; // Default to no bonus on error
    }
  }

  /**
   * Get streak history (detailed tracking)
   * TODO: This requires additional table for historical tracking
   * For now, returns last 7 days based on lastSevenDays array
   */
  static async getStreakHistory(): Promise<StreakData[]> {
    try {
      const streak = await this.getStreak();
      if (!streak) return [];

      // Generate last 7 days of data based on lastSevenDays array
      const history: StreakData[] = [];
      const today = new Date();

      for (let i = 0; i < streak.lastSevenDays.length; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (streak.lastSevenDays.length - 1 - i));

        history.push({
          date,
          completed: streak.lastSevenDays[i],
          habitCount: 0, // TODO: Get actual habit count from habit_completions
        });
      }

      return history;
    } catch (error) {
      console.error('Error in StreaksService.getStreakHistory:', error);
      return [];
    }
  }

  /**
   * Reset streak (for testing or user request)
   */
  static async resetStreak(): Promise<boolean> {
    try {
      const userId = await getAuthUserId();

      const { error } = await supabase
        .from('streaks')
        .update({
          current_streak: 0,
          longest_streak: 0,
          last_seven_days: Array(STREAK_CONFIG?.daysToTrack || 7).fill(false),
          last_completion_date: null,
        })
        .eq('user_id', userId);

      if (error) {
        throw new StreaksServiceError(
          error.message,
          STREAK_ERROR_CODES.UPDATE_FAILED
        );
      }

      return true;
    } catch (error) {
      console.error('Error in StreaksService.resetStreak:', error);
      return false;
    }
  }

  /**
   * Initialize streak - NOT NEEDED with Supabase
   * Streak is auto-created by database trigger on user signup
   * This method is kept for backward compatibility but does nothing
   */
  static async initializeStreak(): Promise<Streak | null> {
    console.warn(
      'StreaksService.initializeStreak is deprecated. Streaks are auto-created by Supabase trigger.'
    );
    return this.getStreak();
  }

  /**
   * DEPRECATED: setStreak is not needed
   * Use updateStreakForToday() instead
   */
  static async setStreak(streak: Streak): Promise<boolean> {
    console.warn(
      'StreaksService.setStreak is deprecated. Use updateStreakForToday() instead.'
    );
    return false;
  }
}
