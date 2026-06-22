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
