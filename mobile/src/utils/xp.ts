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

/**
 * Calculate XP required for a given life area level
 */
export function getXPForAreaLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(
    XP_CONFIG.areaBaseXPPerLevel * Math.pow(XP_CONFIG.areaLevelMultiplier, level - 1)
  );
}

/**
 * Calculate level from total XP for a life area
 */
export function getAreaLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpNeeded = 0;

  while (xpNeeded <= totalXP && level < XP_CONFIG.maxAreaLevel) {
    level++;
    xpNeeded = getXPForAreaLevel(level);
  }

  return level - 1;
}

/**
 * Get progress to next level for a life area
 */
export function getAreaLevelProgress(currentXP: number, level: number): {
  current: number;
  max: number;
  percentage: number;
} {
  const currentLevelXP = getXPForAreaLevel(level);
  const nextLevelXP = getXPForAreaLevel(level + 1);

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

/**
 * Calculate points reward for leveling up (global level)
 */
export function calculateGlobalLevelUpReward(newLevel: number): number {
  return newLevel * XP_CONFIG.globalLevelUpBonus;
}

/**
 * Calculate points reward for leveling up a life area
 */
export function calculateAreaLevelUpReward(newLevel: number): number {
  return newLevel * XP_CONFIG.areaLevelUpBonus;
}

/**
 * Calculate points earned from habit completion (separate from XP)
 */
export function calculatePointsFromXP(xp: number): number {
  return Math.floor(xp * XP_CONFIG.pointsToXPRatio);
}
