/**
 * El Guardián — daily guidance types.
 * The Guardian reads the user's recent behaviour (completions, streak,
 * darkness) and speaks once per day with a deterministic, i18n-templated line.
 */

export type GuardianTone = 'celebrate' | 'warn' | 'neutral';

export type GuardianRuleId =
  | 'streakMilestone'
  | 'levelUp'
  | 'allDone'
  | 'darknessHigh'
  | 'darknessMedium'
  | 'partialProgress'
  | 'kickoff'
  | 'idle';

export interface GuardianMessage {
  ruleId: GuardianRuleId;
  tone: GuardianTone;
  /** i18n array key, e.g. 'guardian.rules.allDone' — resolve `${i18nKey}.${variantIndex}` */
  i18nKey: string;
  /** date-seeded index into the rule's variant array; stable within a day */
  variantIndex: number;
  params?: Record<string, string | number>;
}

export interface GuardianInput {
  /** active habits due today (quit habits excluded) */
  todayTotal: number;
  /** of those, how many are completed today */
  todayDone: number;
  currentStreak: number;
  /** the new level if the user leveled up today, else null */
  leveledUpToday: number | null;
  /** 0-100, from computeDarkness() */
  darkness: number;
  /** current hour (0-23) in the profile timezone */
  hour: number;
  /** YYYY-MM-DD in the profile timezone — the daily variation seed */
  dayKey: string;
  userName?: string;
}
