/**
 * El Guardián — rule engine. Pure and deterministic: the same behaviour on
 * the same day always produces the same message (variants rotate daily via a
 * date-seeded hash, so the Guardian doesn't repeat himself day after day).
 */

import type { GuardianInput, GuardianMessage, GuardianRuleId, GuardianTone } from './types';

/** Streaks the Guardian celebrates explicitly. */
const STREAK_MILESTONES = new Set([3, 7, 14, 21, 30, 50, 100]);

/** Number of copy variants per rule — keep in sync with guardian.rules.* arrays in i18n. */
export const VARIANTS_PER_RULE = 3;

/** Stable per-day index into a rule's variant list. */
function seededIndex(dayKey: string, ruleId: string, len: number): number {
  let h = 0;
  const seed = dayKey + ruleId;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % Math.max(len, 1);
}

function message(
  input: GuardianInput,
  ruleId: GuardianRuleId,
  tone: GuardianTone,
  params?: Record<string, string | number>
): GuardianMessage {
  return {
    ruleId,
    tone,
    i18nKey: `guardian.rules.${ruleId}`,
    variantIndex: seededIndex(input.dayKey, ruleId, VARIANTS_PER_RULE),
    params: { name: input.userName ?? '', ...params },
  };
}

/** First matching rule wins (ordered by priority). */
export function pickGuardianMessage(input: GuardianInput): GuardianMessage {
  const { todayTotal, todayDone, currentStreak, leveledUpToday, darkness, hour } = input;

  if (todayDone > 0 && STREAK_MILESTONES.has(currentStreak)) {
    return message(input, 'streakMilestone', 'celebrate', { streak: currentStreak });
  }
  if (leveledUpToday !== null) {
    return message(input, 'levelUp', 'celebrate', { level: leveledUpToday });
  }
  if (todayTotal > 0 && todayDone === todayTotal) {
    return message(input, 'allDone', 'celebrate', { total: todayTotal });
  }
  if (darkness >= 60) {
    return message(input, 'darknessHigh', 'warn', { darkness });
  }
  if (darkness >= 30) {
    return message(input, 'darknessMedium', 'warn', { darkness });
  }
  if (todayDone > 0) {
    return message(input, 'partialProgress', 'neutral', { done: todayDone, total: todayTotal });
  }
  if (hour < 12) {
    return message(input, 'kickoff', 'neutral');
  }
  return message(input, 'idle', 'neutral');
}
