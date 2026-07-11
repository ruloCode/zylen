/**
 * Community Service
 * Activity feed, shared missions, presence and ally stats for the
 * Guardianes/Aliados hub.
 */

import { supabase } from '@/lib/supabase';
import type {
  ActivityEvent,
  AllyStats,
  MissionCheckinResult,
  SharedMission,
} from '@/types/community';

/**
 * Get activity feed for the user's circle (self + accepted friends).
 * Newest first; pass `before` (createdAt of the last item) to page back.
 */
export async function getFriendActivity(
  limit: number = 30,
  before?: Date
): Promise<ActivityEvent[]> {
  try {
    const { data, error } = await supabase.rpc('get_friend_activity', {
      p_limit: limit,
      p_before: before?.toISOString(),
    });

    if (error) throw error;

    return (data || []).map((event: any) => ({
      id: event.id,
      userId: event.user_id,
      username: event.username,
      avatarUrl: event.avatar_url,
      eventType: event.event_type,
      payload: event.payload || {},
      createdAt: new Date(event.created_at),
      isCurrentUser: event.is_current_user,
    }));
  } catch (error) {
    console.error('Error fetching friend activity:', error);
    throw new Error('Failed to fetch friend activity');
  }
}

/**
 * Get active shared missions with participant stack and the caller's state.
 */
export async function getSharedMissions(): Promise<SharedMission[]> {
  try {
    const { data, error } = await supabase.rpc('get_shared_missions');

    if (error) throw error;

    return (data || []).map((mission: any) => ({
      id: mission.mission_id,
      code: mission.code,
      title: mission.title,
      description: mission.description,
      iconName: mission.icon_name,
      durationDays: mission.duration_days,
      rewardXP: mission.reward_xp,
      rewardPoints: mission.reward_points,
      participantCount: mission.participant_count,
      participantAvatars: (mission.participant_avatars || []).map((p: any) => ({
        userId: p.user_id,
        username: p.username,
        avatarUrl: p.avatar_url,
      })),
      isJoined: mission.is_joined,
      myDaysCompleted: mission.my_days_completed,
      checkedInToday: mission.my_checked_in_today,
      isCompleted: mission.my_completed,
    }));
  } catch (error) {
    console.error('Error fetching shared missions:', error);
    throw new Error('Failed to fetch shared missions');
  }
}

/**
 * Join a shared mission
 */
export async function joinSharedMission(
  missionId: string
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const { data, error } = await supabase.rpc('join_shared_mission', {
      p_mission_id: missionId,
    });

    if (error) throw error;

    const result = data as unknown as { ok: boolean; reason?: string };
    return { ok: result?.ok ?? false, reason: result?.reason };
  } catch (error) {
    console.error('Error joining shared mission:', error);
    throw new Error('Failed to join shared mission');
  }
}

/**
 * Daily check-in for a joined mission. On completing the mission the
 * backend grants the reward once and reports the new profile totals.
 */
export async function checkinSharedMission(
  missionId: string
): Promise<MissionCheckinResult> {
  try {
    const { data, error } = await supabase.rpc('checkin_shared_mission', {
      p_mission_id: missionId,
    });

    if (error) throw error;

    const result = data as unknown as {
      ok: boolean;
      reason?: string;
      days_completed?: number;
      mission_completed?: boolean;
      xp_awarded?: number;
      points_awarded?: number;
      new_points?: number | null;
      new_total_xp?: number | null;
      new_level?: number | null;
      leveled_up?: boolean;
    };

    return {
      ok: result?.ok ?? false,
      reason: result?.reason,
      daysCompleted: result?.days_completed ?? 0,
      missionCompleted: result?.mission_completed ?? false,
      xpAwarded: result?.xp_awarded ?? 0,
      pointsAwarded: result?.points_awarded ?? 0,
      newPoints: result?.new_points ?? undefined,
      newTotalXP: result?.new_total_xp ?? undefined,
      newLevel: result?.new_level ?? undefined,
      leveledUp: result?.leveled_up ?? false,
    };
  } catch (error) {
    console.error('Error checking in shared mission:', error);
    throw new Error('Failed to check in shared mission');
  }
}

/**
 * Aggregate tiles for the Aliados tab
 */
export async function getAllyStats(): Promise<AllyStats> {
  try {
    const { data, error } = await supabase.rpc('get_ally_stats');

    if (error) throw error;

    const stats = Array.isArray(data) ? data[0] : data;
    return {
      totalAllies: stats?.total_allies ?? 0,
      activeToday: stats?.active_today ?? 0,
      activeNow: stats?.active_now ?? 0,
      sharedWeeklyXP: stats?.shared_weekly_xp ?? 0,
      sharedWeeklyPoints: stats?.shared_weekly_points ?? 0,
      bestStreak: stats?.best_streak ?? 0,
      bestStreakUsername: stats?.best_streak_username ?? undefined,
    };
  } catch (error) {
    console.error('Error fetching ally stats:', error);
    throw new Error('Failed to fetch ally stats');
  }
}

/**
 * Presence heartbeat (server-side throttled to 5 min). Fire-and-forget:
 * never throws, so it can run during store init without guards.
 */
export async function touchLastActive(): Promise<void> {
  try {
    const { error } = await supabase.rpc('touch_last_active');
    if (error) throw error;
  } catch (error) {
    console.error('Error touching last active:', error);
  }
}
