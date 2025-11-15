/**
 * Stats Service - Supabase Implementation
 *
 * Handles statistical queries and aggregations across multiple tables.
 * Most methods use RPC functions for complex aggregations.
 */

import { supabase } from '@/lib/supabase';
import type { LifeArea } from '@/types/lifeArea';
import { StatsServiceError, STATS_ERROR_CODES } from '@/types/errors';
import { getAuthUserId } from './utils';

/**
 * User statistics interface
 */
export interface UserStats {
  totalCompletions: number;
  activeDays: number;
  activeDaysCount: number; // Alias for activeDays (used in UI)
  dailyAverage: number;
  longestStreak: number;
  currentStreak: number;
  totalXP: number;
  totalLevel: number;
  totalHabits: number; // Total number of user habits
  daysSinceJoining: number;
  topLifeArea: {
    name: string;
    xp: number;
    level: number;
  } | null;
  xpDistribution: Array<{
    areaId: string;
    areaName: string;
    totalXP: number;
    percentage: number;
  }>;
}

/**
 * XP distribution by life area
 */
export interface XPDistribution {
  areaType: string;
  xp: number;
  percentage: number;
}

/**
 * Habit completion trend data point
 */
export interface CompletionTrendPoint {
  date: Date;
  completions: number;
}

export class StatsService {
  /**
   * Get comprehensive user statistics
   * Uses RPC function for efficient aggregation
   */
  static async getUserStats(): Promise<UserStats> {
    try {
      const userId = await getAuthUserId();

      // Get user stats via RPC
      const { data: stats, error } = await supabase.rpc('get_user_stats', {
        p_user_id: userId,
      });

      if (error) {
        throw new StatsServiceError(error.message, STATS_ERROR_CODES.FETCH_FAILED);
      }

      // Get total habits count
      const { count: totalHabits } = await supabase
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get XP distribution across life areas
      const { data: lifeAreas } = await supabase
        .from('life_areas')
        .select('id, area_type, total_xp')
        .eq('user_id', userId)
        .eq('enabled', true);

      // Calculate XP distribution with percentages
      const totalXP = lifeAreas?.reduce((sum, area) => sum + area.total_xp, 0) || 0;
      const xpDistribution = lifeAreas?.map((area) => ({
        areaId: area.id,
        areaName: area.area_type,
        totalXP: area.total_xp,
        percentage: totalXP > 0 ? Math.round((area.total_xp / totalXP) * 100) : 0,
      })) || [];

      // Sort by XP descending
      xpDistribution.sort((a, b) => b.totalXP - a.totalXP);

      const activeDaysValue = stats.active_days || 0;

      return {
        totalCompletions: stats.total_completions || 0,
        activeDays: activeDaysValue,
        activeDaysCount: activeDaysValue, // Alias for UI compatibility
        dailyAverage: stats.daily_average || 0,
        longestStreak: stats.longest_streak || 0,
        currentStreak: stats.current_streak || 0,
        totalXP: stats.total_xp || 0,
        totalLevel: stats.total_level || 0,
        totalHabits: totalHabits || 0,
        daysSinceJoining: stats.days_since_joining || 0,
        topLifeArea: stats.top_life_area
          ? {
              name: stats.top_life_area.name,
              xp: stats.top_life_area.xp,
              level: stats.top_life_area.level,
            }
          : null,
        xpDistribution,
      };
    } catch (error) {
      if (error instanceof StatsServiceError) throw error;
      console.error('Error in StatsService.getUserStats:', error);
      throw new StatsServiceError(
        'Failed to get user stats',
        STATS_ERROR_CODES.FETCH_FAILED
      );
    }
  }

  /**
   * Get total habit completions count
   */
  static async getTotalCompletions(): Promise<number> {
    try {
      const userId = await getAuthUserId();

      const { count, error } = await supabase
        .from('habit_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        throw new StatsServiceError(error.message);
      }

      return count || 0;
    } catch (error) {
      console.error('Error in StatsService.getTotalCompletions:', error);
      return 0;
    }
  }

  /**
   * Get number of active days (days with at least one completion)
   */
  static async getActiveDaysCount(): Promise<number> {
    try {
      const userId = await getAuthUserId();

      // Get distinct dates with completions
      const { data, error } = await supabase
        .from('habit_completions')
        .select('completed_at')
        .eq('user_id', userId);

      if (error) {
        throw new StatsServiceError(error.message);
      }

      // Count unique dates
      const uniqueDates = new Set(
        data.map((c) => new Date(c.completed_at).toDateString())
      );

      return uniqueDates.size;
    } catch (error) {
      console.error('Error in StatsService.getActiveDaysCount:', error);
      return 0;
    }
  }

  /**
   * Get XP distribution across life areas
   * Returns percentage distribution of XP
   */
  static async getXPDistribution(): Promise<XPDistribution[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase.rpc('get_xp_distribution', {
        p_user_id: userId,
      });

      if (error) {
        throw new StatsServiceError(error.message);
      }

      return (
        data?.map((item: any) => ({
          areaType: item.area_type,
          xp: item.total_xp,
          percentage: item.percentage,
        })) || []
      );
    } catch (error) {
      console.error('Error in StatsService.getXPDistribution:', error);
      return [];
    }
  }

  /**
   * Get daily average completions
   * @param activeDays Number of active days (optional, will fetch if not provided)
   */
  static async getDailyAverage(activeDays?: number): Promise<number> {
    try {
      const totalCompletions = await this.getTotalCompletions();
      const days = activeDays ?? (await this.getActiveDaysCount());

      if (days === 0) return 0;

      return Math.round((totalCompletions / days) * 10) / 10; // Round to 1 decimal
    } catch (error) {
      console.error('Error in StatsService.getDailyAverage:', error);
      return 0;
    }
  }

  /**
   * Get current streak from streaks table
   */
  static async getCurrentStreak(): Promise<number> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new StatsServiceError(error.message);
      }

      return data?.current_streak || 0;
    } catch (error) {
      console.error('Error in StatsService.getCurrentStreak:', error);
      return 0;
    }
  }

  /**
   * Get longest streak from streaks table
   */
  static async getLongestStreak(): Promise<number> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('streaks')
        .select('longest_streak')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new StatsServiceError(error.message);
      }

      return data?.longest_streak || 0;
    } catch (error) {
      console.error('Error in StatsService.getLongestStreak:', error);
      return 0;
    }
  }

  /**
   * Get total XP across all life areas
   */
  static async getTotalXP(): Promise<number> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('life_areas')
        .select('total_xp')
        .eq('user_id', userId)
        .eq('enabled', true);

      if (error) {
        throw new StatsServiceError(error.message);
      }

      return data.reduce((sum, area) => sum + area.total_xp, 0);
    } catch (error) {
      console.error('Error in StatsService.getTotalXP:', error);
      return 0;
    }
  }

  /**
   * Get total level across all life areas
   */
  static async getTotalLevel(): Promise<number> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('life_areas')
        .select('level')
        .eq('user_id', userId)
        .eq('enabled', true);

      if (error) {
        throw new StatsServiceError(error.message);
      }

      return data.reduce((sum, area) => sum + area.level, 0);
    } catch (error) {
      console.error('Error in StatsService.getTotalLevel:', error);
      return 0;
    }
  }

  /**
   * Get days since user joined
   */
  static async getDaysSinceJoining(): Promise<number> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (error) {
        throw new StatsServiceError(error.message);
      }

      const joinDate = new Date(data.created_at);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - joinDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch (error) {
      console.error('Error in StatsService.getDaysSinceJoining:', error);
      return 0;
    }
  }

  /**
   * Get the top life area (most XP)
   */
  static async getTopLifeArea(): Promise<{
    name: string;
    xp: number;
    level: number;
  } | null> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('life_areas')
        .select('area_type, total_xp, level')
        .eq('user_id', userId)
        .eq('enabled', true)
        .order('total_xp', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        throw new StatsServiceError(error.message);
      }

      if (!data) return null;

      return {
        name: data.area_type,
        xp: data.total_xp,
        level: data.level,
      };
    } catch (error) {
      console.error('Error in StatsService.getTopLifeArea:', error);
      return null;
    }
  }

  /**
   * Get habit completion trend over specified days
   * @param days Number of days to look back (default: 30)
   */
  static async getCompletionTrend(days = 30): Promise<CompletionTrendPoint[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase.rpc('get_habit_completion_trend', {
        p_user_id: userId,
        p_days: days,
      });

      if (error) {
        throw new StatsServiceError(error.message);
      }

      return (
        data?.map((point: any) => ({
          date: new Date(point.date),
          completions: point.completions,
        })) || []
      );
    } catch (error) {
      console.error('Error in StatsService.getCompletionTrend:', error);
      return [];
    }
  }

  /**
   * Get completions by life area
   * Returns count of habit completions grouped by life area
   */
  static async getCompletionsByLifeArea(): Promise<
    Array<{ areaType: string; completions: number }>
  > {
    try {
      const userId = await getAuthUserId();

      // Get all completions with their habit's life area
      const { data, error } = await supabase
        .from('habit_completions')
        .select(
          `
          id,
          habits!inner (
            life_area_id,
            life_areas!inner (
              area_type
            )
          )
        `
        )
        .eq('user_id', userId);

      if (error) {
        throw new StatsServiceError(error.message);
      }

      // Group by area type
      const grouped = new Map<string, number>();

      data.forEach((completion: any) => {
        const areaType = completion.habits?.life_areas?.area_type;
        if (areaType) {
          grouped.set(areaType, (grouped.get(areaType) || 0) + 1);
        }
      });

      return Array.from(grouped.entries()).map(([areaType, completions]) => ({
        areaType,
        completions,
      }));
    } catch (error) {
      console.error('Error in StatsService.getCompletionsByLifeArea:', error);
      return [];
    }
  }

  /**
   * Get total points spent in shop
   */
  static async getTotalPointsSpent(): Promise<number> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('purchases')
        .select('cost')
        .eq('user_id', userId);

      if (error) {
        throw new StatsServiceError(error.message);
      }

      return data.reduce((sum, p) => sum + p.cost, 0);
    } catch (error) {
      console.error('Error in StatsService.getTotalPointsSpent:', error);
      return 0;
    }
  }

  /**
   * Get completion rate for a specific date range
   * @param startDate Start of date range
   * @param endDate End of date range
   */
  static async getCompletionRate(startDate: Date, endDate: Date): Promise<number> {
    try {
      const userId = await getAuthUserId();

      // Get total habits count
      const { count: totalHabits } = await supabase
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get completions in date range
      const { data: completions, error } = await supabase
        .from('habit_completions')
        .select('completed_at')
        .eq('user_id', userId)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());

      if (error) {
        throw new StatsServiceError(error.message);
      }

      if (!totalHabits || totalHabits === 0) return 0;

      // Calculate number of days in range
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Expected completions = total habits * days
      const expectedCompletions = totalHabits * diffDays;
      const actualCompletions = completions.length;

      // Return percentage
      return Math.round((actualCompletions / expectedCompletions) * 100);
    } catch (error) {
      console.error('Error in StatsService.getCompletionRate:', error);
      return 0;
    }
  }
}
