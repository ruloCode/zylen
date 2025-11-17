export interface User {
  id: string;
  name: string; // User name (now required)
  username?: string; // Unique username for social features
  points: number; // Spendable currency for shop (separate from XP)
  totalXPEarned: number; // Total XP accumulated (for global level)
  level: number; // Global level (based on totalXPEarned)
  joinedAt: Date;
  avatarUrl?: string;
  hasCompletedOnboarding: boolean; // Whether user has completed the onboarding flow
  selectedLifeAreas: string[]; // IDs of active life areas
  timezone: string; // IANA timezone (e.g., 'America/Bogota') for habit reset calculation
}

export interface UserStats {
  totalHabitsCompleted: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  currentBalance: number;
  currentStreak: number;
  longestStreak: number;
}

/**
 * Public user profile data visible to other users for social features
 */
export interface PublicUserProfile {
  id: string;
  username: string;
  level: number;
  avatarUrl?: string;
  currentStreak: number;
  longestStreak: number;
  totalXPEarned: number;
  points: number;
  createdAt: Date;
}
