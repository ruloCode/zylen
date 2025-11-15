/**
 * Application configuration constants
 */

export const APP_CONFIG = {
  name: 'MyWay',
  displayName: 'LifeQuest',
  tagline: 'Your Life, Leveled Up',
  version: '1.0.0',
} as const;

// XP & Points configuration
export const XP_CONFIG = {
  baseXPPerLevel: 100,
  levelMultiplier: 1.5,
  maxLevel: 100,
  minHabitXP: 10,
  maxHabitXP: 100,
} as const;

// Streak configuration
export const STREAK_CONFIG = {
  daysToTrack: 7,
  minStreakForReward: 3,
  maxStreakBonus: 2.0, // 2x multiplier at high streaks
} as const;

// Shop configuration
export const SHOP_CONFIG = {
  minItemCost: 10,
  maxItemCost: 500,
  warningThreshold: 0.5, // Warn if purchase > 50% of balance
} as const;

// Storage keys for localStorage
export const STORAGE_KEYS = {
  USER: 'myway_user',
  HABITS: 'myway_habits',
  LIFE_AREAS: 'myway_life_areas',
  STREAKS: 'myway_streaks',
  SHOP: 'myway_shop',
  PURCHASES: 'myway_purchases',
  SETTINGS: 'myway_settings',
  APP_STATE: 'myway_app_state',
} as const;

// Life areas configuration
export const LIFE_AREAS = [
  'Health',
  'Finance',
  'Creativity',
  'Social',
  'Family',
  'Career',
] as const;

// Chat configuration
export const CHAT_CONFIG = {
  maxMessages: 100,
  typingDelay: 1000, // ms
  aiResponseDelay: 1500, // ms
  maxMessageLength: 500,
} as const;

// Feature flags
export const FEATURES = {
  enableChat: true,
  enableShop: true,
  enableRootHabit: true,
  enableAchievements: false, // Future feature
  enableMultiplayer: false, // Future feature
} as const;
