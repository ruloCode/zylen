import type { Gender } from './user';
import type { TimeOfDay } from './habit';

export interface OnboardingState {
  currentStep: number; // Current step index (0-5)
  completedSteps: number[]; // Array of completed step indices
  isOnboardingComplete: boolean;
  temporaryData: OnboardingData;
  /** Owner of this in-progress state — guards multi-account devices. */
  userId?: string;
}

/** The habit the user picks during onboarding (created in DB at the payoff step). */
export interface FirstHabitSelection {
  name: string;
  iconName: string;
  xp: number;
  lifeArea: string; // Life area ID
  templateId?: string; // Catalog template it came from (custom habits omit it)
}

export interface OnboardingData {
  userName?: string;
  avatarUrl?: string; // Selected avatar URL (preset or AI-generated)
  gender?: Gender; // Player identity, drives gendered language
  motivation?: string; // Primary reason for using the app
  preferredTimeOfDay?: TimeOfDay; // When the user wants to work on themselves
  firstHabit?: FirstHabitSelection;

  // ── Idempotency markers ──
  // Persisted so the payoff sequence can resume after a kill/retry without
  // duplicating writes (profile update, habit insert, completion RPC).
  profileSaved?: boolean;
  firstHabitId?: string; // DB id once the habit was actually created
  firstHabitSource?: string; // Fingerprint of the selection firstHabitId came from
  firstHabitCompleted?: boolean;
  firstHabitXp?: number; // Real XP awarded by the complete_habit RPC
  firstHabitPoints?: number;
}

export interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  isValid: boolean; // Whether current step data is valid
}

/**
 * Mobile flow (diverges from the web on purpose). Retention-first shape:
 * one tap-question per screen, the first habit is chosen AND completed inside
 * the onboarding (first Luz earned before reaching Home), and the notification
 * permission is asked last with context. There is NO life-areas step: every
 * area ships enabled by default.
 */
export const ONBOARDING_STEPS = {
  HERO: 0, // Name + avatar (preset or AI-generated) + identity (gender)
  MOTIVATION: 1, // Single tap-question: why are you here
  TIME_OF_DAY: 2, // Single tap-question: when do you want to work on it
  FIRST_HABIT: 3, // Pick exactly one habit (suggestions ranked by motivation)
  PAYOFF: 4, // Personalized summary + complete the first habit (aha moment)
  NOTIFICATIONS: 5, // Contextual pre-prompt for the reminders permission
} as const;

export const TOTAL_ONBOARDING_STEPS = 6;
