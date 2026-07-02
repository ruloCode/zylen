import { ReactNode } from 'react';

/**
 * Habit tracking type:
 * - check: simple yes/no per day (default, backward compatible)
 * - measurable: track a number/distance/time toward an optional daily goal
 * - quit: a habit to break; each day "resisted" extends the streak, a relapse resets it
 */
export type HabitType = 'check' | 'measurable' | 'quit';

/** How a measurable habit is logged */
export type MeasurableTracking = 'manual' | 'timer' | 'countdown';

/** Preferred part of the day for a habit (drives filters and reminders) */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface Habit {
  id: string;
  name: string;
  iconName: string; // Changed from icon: ReactNode to iconName: string
  xp: number;
  points: number; // Calculated points (xp × 0.5) - cached for display
  completed: boolean;
  lifeArea: string; // Life area ID (now required)
  createdAt?: Date;
  completedAt?: Date;

  // ── Zylen v2 fields (additive, backward compatible) ──
  habitType?: HabitType;     // defaults to 'check'
  unit?: string;             // measurable: 'min', 'km', 'reps', 'pages'...
  dailyGoal?: number;        // measurable: optional target per day
  color?: string;            // accent color (hsl/hex) for cards & heatmap
  timeOfDay?: TimeOfDay;     // defaults to 'anytime'
  reminderEnabled?: boolean; // local PWA reminder toggle
}

export type LifeAreaType =
  | 'Health'
  | 'Finance'
  | 'Creativity'
  | 'Social'
  | 'Family'
  | 'Career';

export interface HabitFormData {
  name: string;
  iconName: string;
  xp: number;
  lifeArea: string; // Life area ID (required)
  habitType?: HabitType;
  unit?: string;
  dailyGoal?: number;
  color?: string;
  timeOfDay?: TimeOfDay;
  reminderEnabled?: boolean;
}

export interface HabitCompletion {
  habitId: string;
  completedAt: Date;
  xpEarned: number;
  value?: number; // measurable: amount logged for that completion
}

/** A single day's aggregated history for heatmaps / analytics */
export interface HabitDayLog {
  date: string; // YYYY-MM-DD (in user's local time)
  count: number; // number of completions that day (usually 0 or 1)
  value: number; // summed measured value that day (0 for check/quit)
}

/** Streak snapshot returned by the complete/uncomplete/relapse RPCs */
export interface StreakSnapshot {
  current_streak: number;
  longest_streak: number;
  last_completion_date: string | null;
  last_seven_days: boolean[];
}

/**
 * Rich payload returned by the complete_habit v2 RPC.
 * The server is the source of truth for XP (streak bonus + soft daily cap),
 * level and streak; the client syncs its store from this without refetching.
 */
export interface CompleteHabitResult {
  completion_id: string;
  xp_base: number;
  streak_multiplier: number;
  xp_awarded: number;
  capped: boolean;
  points_awarded: number;
  new_total_xp: number;
  new_level: number;
  leveled_up: boolean;
  new_points: number;
  streak: StreakSnapshot;
  life_area: {
    id: string;
    total_xp: number;
    level: number;
    leveled_up: boolean;
  };
}

/** Payload returned by uncomplete_habit v2 */
export interface UncompleteHabitResult {
  completion_id: string;
  xp_reverted: number;
  points_reverted: number;
  new_total_xp: number;
  new_level: number;
  new_points: number;
  streak: StreakSnapshot;
  life_area: {
    id: string;
    total_xp: number;
    level: number;
  };
}

/** Payload returned by record_relapse */
export interface RelapseResult {
  relapse_id: string;
  reverted: boolean;
  reverted_details: UncompleteHabitResult | null;
  streak: StreakSnapshot;
}
