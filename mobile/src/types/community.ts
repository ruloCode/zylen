/**
 * Community hub types: activity feed, shared missions, ally stats,
 * weekly comparison and ranking periods.
 */

export type CommunityTab = 'guardians' | 'allies' | 'streaks';

export type RankingPeriod = 'weekly' | 'alltime';

export type ActivityEventType =
  | 'habit_completed'
  | 'level_up'
  | 'streak_milestone'
  | 'mission_completed';

export interface ActivityEventPayload {
  // habit_completed
  habit_id?: string;
  habit_name?: string;
  xp?: number;
  // level_up
  level?: number;
  // streak_milestone
  streak?: number;
  // mission_completed
  mission_id?: string;
  mission_code?: string;
  mission_title?: string;
  reward_xp?: number;
}

export interface ActivityEvent {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  eventType: ActivityEventType;
  payload: ActivityEventPayload;
  createdAt: Date;
  isCurrentUser: boolean;
}

export interface MissionParticipantAvatar {
  userId: string;
  username: string;
  avatarUrl?: string;
}

export interface SharedMission {
  id: string;
  code: string;
  title: string;
  description: string;
  iconName?: string;
  durationDays: number;
  rewardXP: number;
  rewardPoints: number;
  participantCount: number;
  participantAvatars: MissionParticipantAvatar[];
  isJoined: boolean;
  myDaysCompleted: number;
  checkedInToday: boolean;
  isCompleted: boolean;
}

export interface MissionCheckinResult {
  ok: boolean;
  reason?: string;
  daysCompleted: number;
  missionCompleted: boolean;
  xpAwarded: number;
  pointsAwarded: number;
  newPoints?: number;
  newTotalXP?: number;
  newLevel?: number;
  leveledUp?: boolean;
}

export interface AllyStats {
  totalAllies: number;
  activeToday: number;
  activeNow: number;
  sharedWeeklyXP: number;
  sharedWeeklyPoints: number;
  bestStreak: number;
  bestStreakUsername?: string;
}

/**
 * Current vs previous week deltas. Pct is null when there is no previous
 * week row (or it was 0) — the UI shows "—" instead of a percentage.
 */
export interface WeeklyComparison {
  currentXP: number;
  previousXP: number;
  xpChangePct: number | null;
  currentPoints: number;
  previousPoints: number;
  pointsChangePct: number | null;
  hasPreviousWeek: boolean;
}
