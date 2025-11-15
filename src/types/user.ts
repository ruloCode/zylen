export interface User {
  id: string;
  name?: string;
  points: number;
  totalXPEarned: number;
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
