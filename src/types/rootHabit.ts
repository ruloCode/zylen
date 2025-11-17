/**
 * Root Habit Types
 *
 * Types for the 30-day challenge feature
 */

export interface RootHabitCheckIn {
  id: string;
  user_id: string;
  day_number: number;
  checked_in_at: string;
  xp_earned: number;
}

export interface RootHabitProgress {
  total_days_completed: number;
  current_day: number;
  completed_days: number[];
  completion_percentage: number;
  is_completed: boolean;
}

export interface RootHabitState {
  progress: RootHabitProgress | null;
  checkins: RootHabitCheckIn[];
  isLoading: boolean;
  error: string | null;
}
