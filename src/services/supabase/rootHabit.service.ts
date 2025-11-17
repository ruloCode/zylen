/**
 * Root Habit Service - Supabase Implementation
 *
 * Manages the 30-day challenge feature including check-ins,
 * progress tracking, and XP rewards.
 */

import { supabase } from '@/lib/supabase';
import type { RootHabitCheckIn, RootHabitProgress } from '@/types/rootHabit';
import { getAuthUserId } from './utils';

/**
 * XP earned per root habit check-in
 */
const ROOT_HABIT_XP = 20;

export class RootHabitService {
  /**
   * Get all check-ins for the current user
   */
  static async getCheckIns(): Promise<RootHabitCheckIn[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('root_habit_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('day_number');

      if (error) {
        console.error('Error in RootHabitService.getCheckIns:', error);
        throw new Error('Failed to get check-ins');
      }

      return data || [];
    } catch (error) {
      console.error('Error in RootHabitService.getCheckIns:', error);
      throw error;
    }
  }

  /**
   * Get progress summary for the 30-day challenge
   */
  static async getProgress(): Promise<RootHabitProgress> {
    try {
      const userId = await getAuthUserId();

      // Use the Supabase function we created
      const { data, error } = await supabase
        .rpc('get_root_habit_progress', { p_user_id: userId })
        .single();

      if (error) {
        console.error('Error in RootHabitService.getProgress:', error);
        // Return empty progress if function fails
        return {
          total_days_completed: 0,
          current_day: 0,
          completed_days: [],
          completion_percentage: 0,
          is_completed: false,
        };
      }

      return data;
    } catch (error) {
      console.error('Error in RootHabitService.getProgress:', error);
      return {
        total_days_completed: 0,
        current_day: 0,
        completed_days: [],
        completion_percentage: 0,
        is_completed: false,
      };
    }
  }

  /**
   * Check in for the next day in the challenge
   * Returns the new check-in and the XP earned
   */
  static async checkIn(): Promise<{ checkIn: RootHabitCheckIn; xpEarned: number }> {
    try {
      const userId = await getAuthUserId();

      // Get current progress to determine next day
      const progress = await this.getProgress();
      const nextDay = progress.current_day + 1;

      if (nextDay > 30) {
        throw new Error('Challenge already completed');
      }

      // Check if this day is already checked in
      if (progress.completed_days.includes(nextDay)) {
        throw new Error('Day already checked in');
      }

      // Insert the check-in
      const { data, error } = await supabase
        .from('root_habit_checkins')
        .insert({
          user_id: userId,
          day_number: nextDay,
          xp_earned: ROOT_HABIT_XP,
        })
        .select()
        .single();

      if (error) {
        console.error('Error in RootHabitService.checkIn:', error);
        throw new Error('Failed to check in');
      }

      // Award XP to user profile
      await this.awardXP(userId, ROOT_HABIT_XP);

      return { checkIn: data, xpEarned: ROOT_HABIT_XP };
    } catch (error) {
      console.error('Error in RootHabitService.checkIn:', error);
      throw error;
    }
  }

  /**
   * Check in for a specific day (for testing or manual adjustments)
   */
  static async checkInDay(dayNumber: number): Promise<RootHabitCheckIn> {
    try {
      const userId = await getAuthUserId();

      if (dayNumber < 1 || dayNumber > 30) {
        throw new Error('Day number must be between 1 and 30');
      }

      const { data, error } = await supabase
        .from('root_habit_checkins')
        .insert({
          user_id: userId,
          day_number: dayNumber,
          xp_earned: ROOT_HABIT_XP,
        })
        .select()
        .single();

      if (error) {
        // If error is due to unique constraint, day is already checked in
        if (error.code === '23505') {
          throw new Error('Day already checked in');
        }
        console.error('Error in RootHabitService.checkInDay:', error);
        throw new Error('Failed to check in day');
      }

      // Award XP to user profile
      await this.awardXP(userId, ROOT_HABIT_XP);

      return data;
    } catch (error) {
      console.error('Error in RootHabitService.checkInDay:', error);
      throw error;
    }
  }

  /**
   * Delete a check-in (undo)
   */
  static async deleteCheckIn(dayNumber: number): Promise<void> {
    try {
      const userId = await getAuthUserId();

      const { error } = await supabase
        .from('root_habit_checkins')
        .delete()
        .eq('user_id', userId)
        .eq('day_number', dayNumber);

      if (error) {
        console.error('Error in RootHabitService.deleteCheckIn:', error);
        throw new Error('Failed to delete check-in');
      }

      // Deduct XP from user profile
      await this.awardXP(userId, -ROOT_HABIT_XP);
    } catch (error) {
      console.error('Error in RootHabitService.deleteCheckIn:', error);
      throw error;
    }
  }

  /**
   * Reset all check-ins (start over)
   */
  static async resetChallenge(): Promise<void> {
    try {
      const userId = await getAuthUserId();

      // Get current progress to calculate XP to deduct
      const progress = await this.getProgress();
      const xpToDeduct = progress.total_days_completed * ROOT_HABIT_XP;

      // Delete all check-ins
      const { error } = await supabase
        .from('root_habit_checkins')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error in RootHabitService.resetChallenge:', error);
        throw new Error('Failed to reset challenge');
      }

      // Deduct all earned XP
      if (xpToDeduct > 0) {
        await this.awardXP(userId, -xpToDeduct);
      }
    } catch (error) {
      console.error('Error in RootHabitService.resetChallenge:', error);
      throw error;
    }
  }

  /**
   * Award XP to user profile
   * Private helper method
   */
  private static async awardXP(userId: string, xp: number): Promise<void> {
    try {
      // Get current XP
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_xp_earned')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        throw new Error('Failed to fetch profile');
      }

      const newXP = Math.max(0, (profile.total_xp_earned || 0) + xp);

      // Update XP
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ total_xp_earned: newXP })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating XP:', updateError);
        throw new Error('Failed to update XP');
      }
    } catch (error) {
      console.error('Error in RootHabitService.awardXP:', error);
      throw error;
    }
  }

  /**
   * Check if user can check in today (has completed previous days)
   */
  static async canCheckInToday(): Promise<boolean> {
    try {
      const progress = await this.getProgress();

      // Can check in if challenge not completed and next day is sequential
      if (progress.is_completed || progress.current_day >= 30) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in RootHabitService.canCheckInToday:', error);
      return false;
    }
  }
}
