import { ReactNode } from 'react';

export interface Habit {
  id: string;
  name: string;
  iconName: string; // Changed from icon: ReactNode to iconName: string
  xp: number;
  completed: boolean;
  lifeArea?: LifeAreaType;
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
  xp: number;
  lifeArea: LifeAreaType;
}

export interface HabitCompletion {
  habitId: string;
  completedAt: Date;
  xpEarned: number;
}
