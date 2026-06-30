import type { Gender, ExperienceLevel } from './user';

export interface OnboardingState {
  currentStep: number; // Current step index (0-3)
  completedSteps: number[]; // Array of completed step indices
  isOnboardingComplete: boolean;
  temporaryData: OnboardingData;
}

export interface OnboardingData {
  userName?: string;
  username?: string; // Unique username for social features
  avatarUrl?: string; // Selected avatar URL (Rulo or Dani)
  gender?: Gender; // Player identity, drives gendered language
  ageRange?: string; // Self-reported age bucket (e.g. '18-24')
  experienceLevel?: ExperienceLevel; // Self-reported experience with habits
  motivation?: string; // Primary reason for using the app
  selectedLifeAreaIds?: string[]; // IDs of selected life areas
  createdHabits?: Array<{
    name: string;
    iconName: string;
    xp: number;
    lifeArea: string; // Life area ID
  }>;
}

export interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  isValid: boolean; // Whether current step data is valid
}

export const ONBOARDING_STEPS = {
  WELCOME: 0, // Name + avatar + identity (gender)
  ABOUT_YOU: 1, // Motivation + experience + age range
  LIFE_AREAS: 2,
  HABITS: 3,
  TUTORIAL: 4,
} as const;

export const TOTAL_ONBOARDING_STEPS = 5;
