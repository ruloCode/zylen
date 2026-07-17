export interface User {
  id: string;
  name: string; // User name (now required)
  username?: string; // Unique username for social features
  points: number; // Spendable currency for shop (separate from XP)
  totalXPEarned: number; // Total XP accumulated (for global level)
  level: number; // Global level (based on totalXPEarned)
  joinedAt: Date;
  avatarUrl?: string;
  avatarBodyUrl?: string; // Full-body hero PNG for custom AI avatars (storage URL)
  heroModelUrl?: string; // Forged 3D hero GLB for the arena (storage URL)
  hasCompletedOnboarding: boolean; // Whether user has completed the onboarding flow
  selectedLifeAreas: string[]; // IDs of active life areas
  timezone: string; // IANA timezone (e.g., 'America/Bogota') for habit reset calculation
  gender?: Gender; // Player identity, drives gendered language (undefined === neutral)
  ageRange?: string; // Self-reported age bucket (e.g. '18-24')
  experienceLevel?: ExperienceLevel; // Self-reported experience with habit building
  motivation?: string; // Primary reason for using the app (e.g. 'health')
}

/** Player identity used to drive gendered copy. Neutral falls back to base (neutral) strings. */
export type Gender = 'female' | 'male' | 'neutral';

/** Self-reported experience with habit building. */
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserStats {
  totalHabitsCompleted: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  currentBalance: number;
  currentStreak: number;
  longestStreak: number;
}

/**
 * Public user profile data visible to other users for social features
 */
export interface PublicUserProfile {
  id: string;
  username: string;
  level: number;
  avatarUrl?: string;
  currentStreak: number;
  longestStreak: number;
  totalXPEarned: number;
  points: number;
  createdAt: Date;
  /** Last presence heartbeat; undefined for users inactive since the column shipped */
  lastActiveAt?: Date;
}
