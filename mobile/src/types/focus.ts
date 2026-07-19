/**
 * Focus (Pomodoro) feature types — gems grown by completing focus sessions.
 */

export type GemSpecies =
  | 'health'
  | 'finance'
  | 'creativity'
  | 'social'
  | 'family'
  | 'career';

export const GEM_SPECIES: GemSpecies[] = [
  'health',
  'finance',
  'creativity',
  'social',
  'family',
  'career',
];

export type FocusSessionStatus = 'running' | 'completed' | 'broken';

export type FocusBreakReason = 'paused_too_long' | 'abandoned' | 'expired';

/** A user-created gem: a focus "tag" tied to a species and optionally a habit. */
export interface FocusGem {
  id: string;
  name: string;
  species: GemSpecies;
  habitId?: string | null;
  activity?: string | null;
  createdAt?: Date;
}

export interface FocusGemFormData {
  name: string;
  species: GemSpecies;
  habitId?: string;
  activity?: string;
}

/** Completed-gem counts per species (feeds the Arena buffs). */
export type SpeciesCounts = Partial<Record<GemSpecies, number>>;

/** Availability of a species for this user (Forest-style progression). */
export interface FocusSpeciesState {
  key: GemSpecies;
  /** Price in points (Esencia); 0 for default species. */
  price: number;
  isDefault: boolean;
  unlocked: boolean;
}

export interface UnlockSpeciesResult {
  species: GemSpecies;
  pointsPaid: number;
  /** Absent in the dev adapter — the slice decrements locally. */
  newPoints?: number;
}

export interface FocusPeriodStats {
  completed: number;
  broken: number;
  minutes: number;
  xp: number;
}

export interface FocusSessionRecord {
  id: string;
  species: GemSpecies;
  durationMinutes: number;
  startedAt: string;
  endedAt: string | null;
  status: FocusSessionStatus;
  breakReason?: FocusBreakReason | null;
  xpAwarded: number;
  gemName?: string | null;
}

export type FocusVaultPeriod = 'today' | 'week' | 'month' | 'year';

export interface FocusStats {
  speciesCounts: SpeciesCounts;
  today: FocusPeriodStats;
  week: FocusPeriodStats;
  month: FocusPeriodStats;
  year: FocusPeriodStats;
  /** Server-authoritative period boundaries (ISO), user-timezone aware. */
  periodStarts: Record<FocusVaultPeriod, string>;
  recentSessions: FocusSessionRecord[];
  /** Whether today's focus-challenge reward has already been claimed. */
  todayRewardClaimed: boolean;
}

/**
 * claim_daily_focus_reward payload. `ok` is false when the goal isn't met yet
 * or the reward was already claimed today. Profile totals are optional: the
 * dev (SKIP_AUTH) adapter cannot know them, so the slice falls back to
 * incrementing the local user when they are absent.
 */
export interface ClaimDailyRewardResult {
  ok: boolean;
  reason?: 'goal_not_met' | 'already_claimed';
  pointsAwarded: number;
  xpAwarded: number;
  newPoints?: number;
  newTotalXP?: number;
  newLevel?: number;
  leveledUp?: boolean;
}

export interface StartFocusSessionResult {
  sessionId: string;
  startedAt: string;
  species: GemSpecies;
}

/**
 * complete_focus_session sync payload. The profile totals are optional: the
 * dev (VITE_SKIP_AUTH) adapter cannot know them, so the slice falls back to
 * incrementing the local user when they are absent.
 */
export interface CompleteFocusSessionResult {
  sessionId: string;
  broken: boolean;
  reason?: FocusBreakReason;
  xpAwarded: number;
  pointsAwarded: number;
  capped: boolean;
  newTotalXP?: number;
  newLevel?: number;
  leveledUp?: boolean;
  newPoints?: number;
  lifeArea?: {
    id: string;
    totalXP: number;
    level: number;
    leveledUp: boolean;
  } | null;
  speciesCounts: SpeciesCounts;
}

/**
 * The running session as persisted to localStorage. Everything derives from
 * wall-clock anchors so a reload (or a background tab) never loses time:
 *   elapsed(now) = now - startedAt - pausedAccumMs - (pauseStartedAt ? now - pauseStartedAt : 0)
 */
export interface ActiveFocusSession {
  sessionId: string;
  gemId: string;
  gemName: string;
  species: GemSpecies;
  durationMs: number;
  /** epoch ms */
  startedAt: number;
  /** finished pause spans, ms */
  pausedAccumMs: number;
  /** epoch ms while paused, null while running */
  pauseStartedAt: number | null;
}
