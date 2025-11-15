/**
 * Application configuration constants
 */

export const APP_CONFIG = {
  name: 'Zylen',
  displayName: 'Zylen',
  // tagline is now in i18n translations: app.tagline
  version: '1.0.0',
} as const;

// XP & Points configuration
export const XP_CONFIG = {
  // Global level configuration (fast progression: level 10 in ~7 days)
  baseXPPerLevel: 150, // Base XP needed for first level
  levelMultiplier: 1.08, // Gentle exponential growth (was 1.5)
  maxLevel: 50, // Global level cap

  // Life area level configuration (same progression per area)
  areaBaseXPPerLevel: 150,
  areaLevelMultiplier: 1.08,
  maxAreaLevel: 50,

  // Habit XP ranges
  minHabitXP: 10,
  maxHabitXP: 100,

  // Level-up rewards (points bonus)
  globalLevelUpBonus: 100, // Points awarded per global level (level × 100)
  areaLevelUpBonus: 25, // Points awarded per area level (level × 25)

  // Point rewards for habits (separate from XP)
  pointsToXPRatio: 0.5, // 1 XP = 0.5 points (so 30 XP habit = 15 points)
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
  USER: 'zylen_user',
  HABITS: 'zylen_habits',
  LIFE_AREAS: 'zylen_life_areas',
  STREAKS: 'zylen_streaks',
  SHOP: 'zylen_shop',
  PURCHASES: 'zylen_purchases',
  SETTINGS: 'zylen_settings',
  APP_STATE: 'zylen_app_state',
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
