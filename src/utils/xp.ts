import { XP_CONFIG } from '@/constants';

/**
 * Calculate XP required for a given level
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(
    XP_CONFIG.baseXPPerLevel * Math.pow(XP_CONFIG.levelMultiplier, level - 1)
  );
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpNeeded = 0;

  while (xpNeeded <= totalXP && level < XP_CONFIG.maxLevel) {
    level++;
    xpNeeded = getXPForLevel(level);
  }

  return level - 1;
}

/**
 * Get progress to next level as percentage
 */
export function getLevelProgress(currentXP: number, level: number): {
  current: number;
  max: number;
  percentage: number;
} {
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);

  const xpInCurrentLevel = currentXP - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;

  const percentage = Math.min(
    100,
    Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100)
  );

  return {
    current: xpInCurrentLevel,
    max: xpNeededForNextLevel,
    percentage,
  };
}
