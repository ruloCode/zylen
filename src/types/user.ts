export interface User {
  id: string;
  name?: string;
  points: number; // Spendable currency for shop (separate from XP)
  totalXPEarned: number; // Total XP accumulated (for global level)
  level: number; // Global level (based on totalXPEarned)
  joinedAt: Date;
  avatarUrl?: string;
}

export interface UserStats {
  totalHabitsCompleted: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  currentBalance: number;
  currentStreak: number;
  longestStreak: number;
}
