/**
 * Leaderboard Service
 * Handles weekly leaderboard and competitive rankings
 */

import { supabase } from '@/lib/supabase';
import type { LeaderboardEntry, WeeklyLeaderboard } from '@/types/social';
import type { WeeklyComparison } from '@/types/community';

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
 * Get weekly leaderboard with user position
 */
export async function getWeeklyLeaderboard(
  userId: string,
  limit: number = 50,
  weekStartDate?: Date
): Promise<WeeklyLeaderboard> {
  try {
    const { data, error } = await supabase.rpc('get_weekly_leaderboard', {
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
      currentStreak: entry.current_streak ?? undefined,
    }));

    // Get current user's entry
    const userEntry = entries.find((e) => e.isCurrentUser);
    const userRank = userEntry?.rank || 0;

    // Get week range
    const { weekStart, weekEnd } = await getCurrentWeekRange();

    // Count total participants (users with at least 1 habit completed this week)
    const { count: totalParticipants } = await supabase
      .from('weekly_leaderboard')
      .select('*', { count: 'exact', head: true })
      .eq('week_start_date', weekStart.toISOString().split('T')[0])
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

    // maybeSingle(): a missing row is expected (no habits yet this week) and
    // must not surface as a 406 in the console like .single() does.
    const { data, error } = await supabase
      .from('weekly_leaderboard')
      .select('weekly_xp_earned, weekly_points_earned, habits_completed, rank')
      .eq('user_id', userId)
      .eq('week_start_date', weekStart.toISOString().split('T')[0])
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // User hasn't completed any habits this week
      return {
        weeklyXPEarned: 0,
        weeklyPointsEarned: 0,
        habitsCompleted: 0,
        rank: 0,
      };
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

/**
 * Compare the user's current week vs the previous one.
 * No backend changes needed: weekly_leaderboard keeps past weeks and is
 * readable by authenticated users. Pct is null when the previous week has
 * no row or a 0 value (UI shows "—" instead of a misleading %).
 */
export async function getWeeklyComparison(
  userId: string
): Promise<WeeklyComparison> {
  const { weekStart } = await getCurrentWeekRange();
  const prevStart = new Date(weekStart);
  prevStart.setDate(prevStart.getDate() - 7);

  const toKey = (d: Date) => d.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('weekly_leaderboard')
    .select('week_start_date, weekly_xp_earned, weekly_points_earned')
    .eq('user_id', userId)
    .in('week_start_date', [toKey(weekStart), toKey(prevStart)]);

  if (error) {
    console.error('Error fetching weekly comparison:', error);
    throw new Error('Failed to fetch weekly comparison');
  }

  const current = (data || []).find((r) => r.week_start_date === toKey(weekStart));
  const previous = (data || []).find((r) => r.week_start_date === toKey(prevStart));

  const pct = (cur: number, prev: number): number | null =>
    prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;

  const currentXP = current?.weekly_xp_earned ?? 0;
  const previousXP = previous?.weekly_xp_earned ?? 0;
  const currentPoints = current?.weekly_points_earned ?? 0;
  const previousPoints = previous?.weekly_points_earned ?? 0;

  return {
    currentXP,
    previousXP,
    xpChangePct: previous ? pct(currentXP, previousXP) : null,
    currentPoints,
    previousPoints,
    pointsChangePct: previous ? pct(currentPoints, previousPoints) : null,
    hasPreviousWeek: !!previous,
  };
}

/**
 * All-time ranking ("Histórico") straight from the public profile view,
 * ordered by lifetime XP. Rank is positional (no ties handling — same as
 * showing the ordered list).
 */
export async function getAllTimeLeaderboard(
  userId: string,
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await supabase
      .from('v_user_public_profile')
      .select('id, username, avatar_url, level, total_xp_earned, points, current_streak')
      .order('total_xp_earned', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row: any, index: number) => ({
      rank: index + 1,
      userId: row.id,
      username: row.username,
      avatarUrl: row.avatar_url,
      level: row.level,
      // Reuse the entry shape: for all-time, "weekly" fields carry lifetime totals
      weeklyXPEarned: row.total_xp_earned,
      weeklyPointsEarned: row.points,
      habitsCompleted: 0,
      isCurrentUser: row.id === userId,
      currentStreak: row.current_streak ?? undefined,
    }));
  } catch (error) {
    console.error('Error fetching all-time leaderboard:', error);
    throw new Error('Failed to fetch all-time leaderboard');
  }
}
