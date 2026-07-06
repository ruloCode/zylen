/**
 * Social feature types for friendships and leaderboard
 */

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'none' | 'request_sent' | 'request_received' | 'friends';

/**
 * Friendship relationship between two users
 */
export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Friend profile with stats and friendship status
 */
export interface FriendProfile {
  friendshipId?: string;
  userId: string;
  username: string;
  level: number;
  avatarUrl?: string;
  currentStreak: number;
  longestStreak: number;
  totalXPEarned: number;
  points: number;
  friendshipStatus: FriendshipStatus;
  friendshipCreatedAt?: Date;
}

/**
 * Search result for users
 */
export interface UserSearchResult {
  id: string;
  username: string;
  level: number;
  avatarUrl?: string;
  currentStreak: number;
  totalXPEarned: number;
  friendshipStatus: FriendshipStatus;
}

/**
 * Weekly leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  level: number;
  weeklyXPEarned: number;
  weeklyPointsEarned: number;
  habitsCompleted: number;
  isCurrentUser: boolean;
}

/**
 * Weekly leaderboard data
 */
export interface WeeklyLeaderboard {
  weekStartDate: Date;
  weekEndDate: Date;
  entries: LeaderboardEntry[];
  userRank: number;
  totalParticipants: number;
}

/**
 * Friend request (incoming or outgoing)
 */
export interface FriendRequest {
  friendshipId: string;
  userId: string;
  username: string;
  level: number;
  avatarUrl?: string;
  currentStreak: number;
  totalXPEarned: number;
  createdAt: Date;
}
