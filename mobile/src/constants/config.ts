/**
 * Application configuration constants
 */

export const APP_CONFIG = {
  name: 'Everlight',
  displayName: 'Everlight',
  // tagline is now in i18n translations: app.tagline
  version: '1.0.0',
} as const;

// XP & Points configuration
export const XP_CONFIG = {
  // Global level configuration (moderate progression: level 10 in ~10-14 days with 3 habits/day)
  baseXPPerLevel: 350, // Base XP needed for first level (increased from 150)
  levelMultiplier: 1.12, // Moderate exponential growth (increased from 1.08 for more challenge)
  maxLevel: 50, // Global level cap

  // Life area level configuration (3x harder than global - more challenging progression)
  areaBaseXPPerLevel: 450, // 3x harder than global (was 150)
  areaLevelMultiplier: 1.15, // Steeper curve (was 1.08)
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
  USER: 'everlight_user',
  HABITS: 'everlight_habits',
  LIFE_AREAS: 'everlight_life_areas',
  STREAKS: 'everlight_streaks',
  SHOP: 'everlight_shop',
  SHOP_ITEMS: 'everlight_shop_items',
  PURCHASES: 'everlight_purchases',
  SETTINGS: 'everlight_settings',
  APP_STATE: 'everlight_app_state',
  THEME: 'everlight_theme',
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

// Avatar configuration
// The avatar is now the evolving chibi hero (a bust crop of tier-0). The old
// 3D "explorer" / Ready-Player-Me-style avatars were retired; every legacy key
// resolves to the chibi so no stale video-style avatar renders anywhere.
const HERO_AVATAR = '/avatars/hero-avatar.png'; // Rulo (male) bust
const DANI_AVATAR = '/avatars/dani-avatar.png'; // Dani (female) bust
export const AVATARS = {
  HERO: HERO_AVATAR,
  RULO: HERO_AVATAR,
  DANI: DANI_AVATAR,
  // Legacy keys kept for backward compatibility with existing imports.
  EXPLORER_1: HERO_AVATAR,
  EXPLORER_2: HERO_AVATAR,
  EXPLORER_3: HERO_AVATAR,
} as const;

// Default avatar for new/unset users.
export const DEFAULT_AVATAR = AVATARS.HERO;

// Selectable avatars surfaced in the avatar picker (onboarding + profile).
// `url`   = square bust shown in the picker / profile / header.
// `body`  = full-body PNG used as the standing hero on the Home (must follow
//           the avatar canvas convention: portrait 2:3, centred, feet at ~93%).
// `video` = idle-loop clips of the same artwork (alpha channel), played over
//           the Home hero instead of the static PNG. Two encodings of the
//           same clip: `mov` (HEVC+alpha — Safari/iOS) and `webm` (VP9+alpha
//           — Chrome/Android/Firefox). Filenames are VERSIONED (-vN): the
//           service worker caches them CacheFirst, so regenerating a clip
//           means bumping the version suffix. `undefined` = static PNG only.
// `nameKey` resolves through i18n (profile.avatars.*).
export const AVATAR_OPTIONS = [
  {
    id: 'rulo',
    nameKey: 'profile.avatars.rulo',
    url: AVATARS.RULO,
    body: '/hero-character.png',
    video: {
      mov: '/avatars/video/rulo-idle-v1.mov',
      webm: '/avatars/video/rulo-idle-v1.webm',
    },
  },
  {
    id: 'dani',
    nameKey: 'profile.avatars.dani',
    url: AVATARS.DANI,
    body: '/avatars/dani-full.png',
    video: undefined,
  },
] as const;

// Default full-body hero character (Rulo) when the user has no/unknown avatar.
export const DEFAULT_HERO_BODY = '/hero-character.png';

/**
 * Resolve the full-body hero character for the Home from the user's saved
 * avatar (which is the bust `url`). Falls back to the default hero.
 */
export function getHeroBodySrc(avatarUrl?: string | null): string {
  const opt = AVATAR_OPTIONS.find((o) => o.url === avatarUrl);
  return opt?.body ?? DEFAULT_HERO_BODY;
}

/** Ordered <source> list for the hero idle-loop video. */
export interface HeroVideoSource {
  src: string;
  type: string;
}

/**
 * Resolve the hero idle-loop video sources from the user's saved avatar.
 * Mirrors getHeroBodySrc; falls back to the default hero. Returns undefined
 * when the avatar has no clip (the hero then stays a static PNG). The mov
 * (HEVC+alpha) source goes first: Safari picks it and Chrome skips to the
 * webm — reversed, Safari would pick the webm and lose the alpha channel.
 */
export function getHeroVideoSources(
  avatarUrl?: string | null
): HeroVideoSource[] | undefined {
  const opt = AVATAR_OPTIONS.find((o) => o.url === avatarUrl);
  const video = (opt ?? AVATAR_OPTIONS[0]).video;
  if (!video) return undefined;
  return [
    { src: video.mov, type: 'video/quicktime' },
    { src: video.webm, type: 'video/webm' },
  ];
}

// Identity & personalization options collected during onboarding.
// `labelKey` resolves through i18n (onboarding.identity.* / onboarding.aboutYou.*).

// Player identity → drives gendered language across the app.
export const GENDER_OPTIONS = [
  { value: 'female', labelKey: 'onboarding.identity.female', emoji: '♀️' },
  { value: 'male', labelKey: 'onboarding.identity.male', emoji: '♂️' },
  { value: 'neutral', labelKey: 'onboarding.identity.neutral', emoji: '⚧️' },
] as const;

export const MOTIVATION_OPTIONS = [
  { value: 'health', labelKey: 'onboarding.aboutYou.motivations.health', emoji: '🌱' },
  { value: 'discipline', labelKey: 'onboarding.aboutYou.motivations.discipline', emoji: '🔥' },
  { value: 'focus', labelKey: 'onboarding.aboutYou.motivations.focus', emoji: '🎯' },
  { value: 'wellbeing', labelKey: 'onboarding.aboutYou.motivations.wellbeing', emoji: '🧘' },
  { value: 'productivity', labelKey: 'onboarding.aboutYou.motivations.productivity', emoji: '⚡' },
] as const;

export const EXPERIENCE_OPTIONS = [
  { value: 'beginner', labelKey: 'onboarding.aboutYou.experience.beginner' },
  { value: 'intermediate', labelKey: 'onboarding.aboutYou.experience.intermediate' },
  { value: 'advanced', labelKey: 'onboarding.aboutYou.experience.advanced' },
] as const;

export const AGE_RANGE_OPTIONS = [
  { value: '13-17', labelKey: 'onboarding.aboutYou.ageRanges.teen' },
  { value: '18-24', labelKey: 'onboarding.aboutYou.ageRanges.youngAdult' },
  { value: '25-34', labelKey: 'onboarding.aboutYou.ageRanges.adult' },
  { value: '35-44', labelKey: 'onboarding.aboutYou.ageRanges.midAdult' },
  { value: '45-54', labelKey: 'onboarding.aboutYou.ageRanges.mature' },
  { value: '55+', labelKey: 'onboarding.aboutYou.ageRanges.senior' },
] as const;

// Arena (embedded co-op game) configuration
export const GAME_CONFIG = {
  url: 'https://noble-shore-296.higgsfield.gg/',
  victoryXP: 75,
  victoryPoints: 25,
  maxRewardedVictoriesPerDay: 3,
  rewardCounterKeyPrefix: 'everlight_game_rewards_', // + yyyy-mm-dd
} as const;

// Focus (Pomodoro) configuration — "Enfoque del día"
export const FOCUS_CONFIG = {
  presets: [10, 25, 45, 60],
  minMinutes: 10,
  maxMinutes: 120,
  xpPerMinute: 1,
  pointsPerXP: 0.5,
  dailyXPSoftCap: 120, // mirrors complete_focus_session damping thresholds
  maxPauseMs: 180_000, // 3 min pause budget, then the gem breaks
  completionGraceMs: 30_000, // server grace before the nominal end
  returnGraceMs: 600_000, // 10 min to come back after the timer ended
  storageKey: 'everlight_focus_session_v1',
  devStorageKey: 'everlight_focus_dev_v1',
  arena: {
    shieldUnlockGems: 10,
    buffTiers: [1, 3, 6, 10, 15],
  },
} as const;

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
  enableAchievements: true, // Real backend (achievements + user_achievements + RPCs)
  enableMultiplayer: false, // Future feature
} as const;

// ===== Mobile-only additions =====

/**
 * Deployed web app origin. Used to build absolute URLs for assets the
 * embedded Arena game must fetch over HTTP (e.g. the avatar bust PNG),
 * since native bundle paths are not reachable from the game's origin.
 */
export const WEB_APP_ORIGIN = 'https://zylen-beta.vercel.app';
