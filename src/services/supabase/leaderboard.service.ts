/**
 * Leaderboard Service
 * Handles weekly leaderboard and competitive rankings
 */

import { supabase } from '@/lib/supabase';
import type { LeaderboardEntry, WeeklyLeaderboard } from '@/types/social';

/**
 * Get the current week's date range
 */
export async function getCurrentWeekRange(): Promise<{
  weekStart: Date;
  weekEnd: Date;
}> {
  try {
    const { data, error } = await supabase.rpc('get_current_week_range');

    if (error) throw error;

    const result = data[0];
    return {
      weekStart: new Date(result.week_start),
      weekEnd: new Date(result.week_end),
    };
  } catch (error) {
    console.error('Error getting current week range:', error);
    // Fallback to client-side calculation
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is 0
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
  }
}

/**
 * Track habit completion for weekly leaderboard
 */
export async function trackHabitCompletion(
  userId: string,
  xpEarned: number,
  pointsEarned: number
): Promise<void> {
  try {
    const { error } = await supabase.rpc('track_weekly_habit_completion', {
      p_user_id: userId,
      p_xp_earned: xpEarned,
      p_points_earned: pointsEarned,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error tracking habit completion for leaderboard:', error);
    // Don't throw - leaderboard tracking is non-critical
  }
}

/**
 * Get weekly leaderboard with user position (friends only)
 */
export async function getWeeklyLeaderboard(
  userId: string,
  limit: number = 50,
  weekStartDate?: Date
): Promise<WeeklyLeaderboard> {
  try {
    const { data, error } = await supabase.rpc('get_friends_weekly_leaderboard', {
      p_user_id: userId,
      p_limit: limit,
      p_week_start: weekStartDate ? weekStartDate.toISOString().split('T')[0] : null,
    });

    if (error) throw error;

    const entries: LeaderboardEntry[] = (data || []).map((entry: any) => ({
      rank: entry.rank,
      userId: entry.user_id,
      username: entry.username,
      avatarUrl: entry.avatar_url,
      level: entry.level,
      weeklyXPEarned: entry.weekly_xp_earned,
      weeklyPointsEarned: entry.weekly_points_earned,
      habitsCompleted: entry.habits_completed,
      isCurrentUser: entry.is_current_user,
    }));

    // Get current user's entry
    const userEntry = entries.find((e) => e.isCurrentUser);
    const userRank = userEntry?.rank || 0;

    // Get week range
    const { weekStart, weekEnd } = await getCurrentWeekRange();

    // Count total friends who have completed at least 1 habit this week
    const { count: totalParticipants } = await supabase
      .from('weekly_leaderboard')
      .select('user_id, friendships!inner(user_id)', { count: 'exact', head: true })
      .eq('week_start_date', weekStart.toISOString().split('T')[0])
      .eq('friendships.user_id', userId)
      .eq('friendships.status', 'accepted')
      .gt('habits_completed', 0);

    return {
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      entries,
      userRank,
      totalParticipants: totalParticipants || 0,
    };
  } catch (error) {
    console.error('Error fetching weekly leaderboard:', error);
    throw new Error('Failed to fetch weekly leaderboard');
  }
}

/**
 * Get user's weekly rank
 */
export async function getUserWeeklyRank(
  userId: string,
  weekStartDate?: Date
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_user_weekly_rank', {
      p_user_id: userId,
      p_week_start: weekStartDate ? weekStartDate.toISOString().split('T')[0] : null,
    });

    if (error) throw error;
    return (data as number) || 0;
  } catch (error) {
    console.error('Error getting user weekly rank:', error);
    return 0;
  }
}

/**
 * Update all ranks for current week
 * This is typically called automatically, but can be triggered manually
 */
export async function updateCurrentWeekRanks(): Promise<void> {
  try {
    const { error } = await supabase.rpc('update_current_week_ranks');
    if (error) throw error;
  } catch (error) {
    console.error('Error updating week ranks:', error);
    throw new Error('Failed to update week ranks');
  }
}

/**
 * Get user's weekly stats
 */
export async function getUserWeeklyStats(
  userId: string,
  weekStartDate?: Date
): Promise<{
  weeklyXPEarned: number;
  weeklyPointsEarned: number;
  habitsCompleted: number;
  rank: number;
} | null> {
  try {
    const { weekStart } = weekStartDate
      ? { weekStart: weekStartDate }
      : await getCurrentWeekRange();

    const { data, error } = await supabase
      .from('weekly_leaderboard')
      .select('weekly_xp_earned, weekly_points_earned, habits_completed, rank')
      .eq('user_id', userId)
      .eq('week_start_date', weekStart.toISOString().split('T')[0])
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - user hasn't completed any habits this week
        return {
          weeklyXPEarned: 0,
          weeklyPointsEarned: 0,
          habitsCompleted: 0,
          rank: 0,
        };
      }
      throw error;
    }

    return {
      weeklyXPEarned: data.weekly_xp_earned,
      weeklyPointsEarned: data.weekly_points_earned,
      habitsCompleted: data.habits_completed,
      rank: data.rank || 0,
    };
  } catch (error) {
    console.error('Error getting user weekly stats:', error);
    return null;
  }
}

/**
 * Get historical leaderboard for a specific week
 */
export async function getHistoricalLeaderboard(
  weekStartDate: Date,
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await supabase
      .from('weekly_leaderboard')
      .select(
        `
        rank,
        user_id,
        weekly_xp_earned,
        weekly_points_earned,
        habits_completed,
        profiles!inner(username, avatar_url, level)
      `
      )
      .eq('week_start_date', weekStartDate.toISOString().split('T')[0])
      .not('rank', 'is', null)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((entry: any) => ({
      rank: entry.rank,
      userId: entry.user_id,
      username: entry.profiles.username,
      avatarUrl: entry.profiles.avatar_url,
      level: entry.profiles.level,
      weeklyXPEarned: entry.weekly_xp_earned,
      weeklyPointsEarned: entry.weekly_points_earned,
      habitsCompleted: entry.habits_completed,
      isCurrentUser: false,
    }));
  } catch (error) {
    console.error('Error fetching historical leaderboard:', error);
    throw new Error('Failed to fetch historical leaderboard');
  }
}
