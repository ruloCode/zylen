export interface Streak {
  currentStreak: number;
  weeklyStreak: number;
  longestStreak: number;
  lastSevenDays: boolean[];
  lastCompletionDate?: Date;
}

export interface StreakData {
  date: Date;
  completed: boolean;
  habitCount: number;
}
