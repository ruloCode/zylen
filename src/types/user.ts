export interface User {
  id: string;
  name: string; // User name (now required)
  points: number; // Spendable currency for shop (separate from XP)
  totalXPEarned: number; // Total XP accumulated (for global level)
  level: number; // Global level (based on totalXPEarned)
  joinedAt: Date;
  avatarUrl?: string;
  hasCompletedOnboarding: boolean; // Whether user has completed the onboarding flow
  selectedLifeAreas: string[]; // IDs of active life areas
}

export interface UserStats {
  totalHabitsCompleted: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  currentBalance: number;
  currentStreak: number;
  longestStreak: number;
}
