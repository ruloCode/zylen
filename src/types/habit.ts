import { ReactNode } from 'react';

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
}

export interface HabitCompletion {
  habitId: string;
  completedAt: Date;
  xpEarned: number;
}
