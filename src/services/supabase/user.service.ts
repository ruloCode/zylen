/**
 * User Service - Supabase Implementation
 *
 * Handles user profile operations using Supabase.
 */

import { supabase } from '@/lib/supabase';
import type { User, UserStats } from '@/types';
import { UserServiceError, USER_ERROR_CODES } from '@/types/errors';
import { getAuthUserId } from './utils';
import { mapProfileToUser, mapUserToProfileUpdate } from './mappers';

export class UserService {
  /**
   * Get current authenticated user's profile
   * @throws {UserServiceError} if user is not authenticated or profile not found
   */
  static async getUser(): Promise<User | null> {
    try {
      const userId = await getAuthUserId();

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Profile not found - this shouldn't happen if trigger works
          console.warn('Profile not found for authenticated user');
          return null;
        }
        throw new UserServiceError(
          profileError.message,
          USER_ERROR_CODES.PROFILE_NOT_FOUND
        );
      }

      // Fetch enabled life areas to populate selectedLifeAreas
      const { data: enabledAreas, error: areasError } = await supabase
        .from('life_areas')
        .select('id')
        .eq('user_id', userId)
        .eq('enabled', true);

      if (areasError) {
        console.error('Error fetching enabled life areas:', areasError);
      }

      const selectedLifeAreas = enabledAreas?.map((area) => area.id) || [];

      return mapProfileToUser(profile, selectedLifeAreas);
    } catch (error) {
      if (error instanceof UserServiceError) throw error;
      console.error('Error in UserService.getUser:', error);
      throw new UserServiceError(
        'Failed to get user profile',
        USER_ERROR_CODES.UPDATE_FAILED
      );
    }
  }

  /**
   * Update user profile
   * @param updates Partial user object with fields to update
   * @throws {UserServiceError} if update fails
   */
  static async updateUser(updates: Partial<User>): Promise<User> {
    try {
      const userId = await getAuthUserId();

      const dbUpdates = mapUserToProfileUpdate(updates);

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new UserServiceError(error.message, USER_ERROR_CODES.UPDATE_FAILED);
      }

      // Fetch updated user with life areas
      const user = await this.getUser();
      if (!user) {
        throw new UserServiceError(
          'Profile not found after update',
          USER_ERROR_CODES.PROFILE_NOT_FOUND
        );
      }

      return user;
    } catch (error) {
      if (error instanceof UserServiceError) throw error;
      console.error('Error in UserService.updateUser:', error);
      throw new UserServiceError(
        'Failed to update user profile',
        USER_ERROR_CODES.UPDATE_FAILED
      );
    }
  }

  /**
   * Update user points (add or subtract)
   * @param delta Amount to add (positive) or subtract (negative)
   * @returns Updated points value
   * @throws {UserServiceError} if update fails
   */
  static async updatePoints(delta: number): Promise<number> {
    try {
      const userId = await getAuthUserId();

      // Use RPC function for atomic update
      const { data, error } = await supabase.rpc('update_user_points', {
        p_user_id: userId,
        p_delta: delta,
      });

      if (error) {
        throw new UserServiceError(error.message, USER_ERROR_CODES.UPDATE_FAILED);
      }

      return data.new_points;
    } catch (error) {
      if (error instanceof UserServiceError) throw error;
      console.error('Error in UserService.updatePoints:', error);
      throw new UserServiceError(
        'Failed to update points',
        USER_ERROR_CODES.UPDATE_FAILED
      );
    }
  }

  /**
   * Update user total XP and recalculate level
   * @param xpDelta Amount of XP to add (positive) or subtract (negative)
   * @returns Object with new total XP and new level
   * @throws {UserServiceError} if update fails
   */
  static async updateXP(xpDelta: number): Promise<{ totalXP: number; level: number }> {
    try {
      const userId = await getAuthUserId();

      // Use RPC function for atomic update with level calculation
      const { data, error } = await supabase.rpc('update_user_xp', {
        p_user_id: userId,
        p_xp_delta: xpDelta,
      });

      if (error) {
        throw new UserServiceError(error.message, USER_ERROR_CODES.UPDATE_FAILED);
      }

      return {
        totalXP: data.new_total_xp,
        level: data.new_level,
      };
    } catch (error) {
      if (error instanceof UserServiceError) throw error;
      console.error('Error in UserService.updateXP:', error);
      throw new UserServiceError(
        'Failed to update XP',
        USER_ERROR_CODES.UPDATE_FAILED
      );
    }
  }

  /**
   * Get user statistics
   * NOTE: This will be fully implemented in StatsService
   * @returns User statistics
   */
  static async getUserStats(): Promise<UserStats> {
    try {
      const userId = await getAuthUserId();

      // For now, return basic stats. Full implementation in StatsService
      const { data: profile } = await supabase
        .from('profiles')
        .select('points, total_xp_earned')
        .eq('id', userId)
        .single();

      const { data: streak } = await supabase
        .from('streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', userId)
        .single();

      const { data: completions, count: completionsCount } = await supabase
        .from('habit_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { data: purchases } = await supabase
        .from('purchases')
        .select('cost')
        .eq('user_id', userId);

      const totalPointsSpent = purchases?.reduce((sum, p) => sum + p.cost, 0) || 0;

      return {
        totalHabitsCompleted: completionsCount || 0,
        totalPointsEarned: profile?.total_xp_earned || 0,
        totalPointsSpent,
        currentBalance: profile?.points || 0,
        currentStreak: streak?.current_streak || 0,
        longestStreak: streak?.longest_streak || 0,
      };
    } catch (error) {
      console.error('Error in UserService.getUserStats:', error);
      // Return default stats instead of throwing
      return {
        totalHabitsCompleted: 0,
        totalPointsEarned: 0,
        totalPointsSpent: 0,
        currentBalance: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }
  }

  /**
   * Initialize user - NOT NEEDED with Supabase
   * User profile is auto-created by database trigger on auth.users insert
   * This method is kept for backward compatibility but does nothing
   */
  static async initializeUser(): Promise<User | null> {
    console.warn(
      'UserService.initializeUser is deprecated. Profiles are auto-created by Supabase trigger.'
    );
    return this.getUser();
  }
}
