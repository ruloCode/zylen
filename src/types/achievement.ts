/**
 * Achievement Types
 *
 * Types for the achievement/badge system
 */

export type AchievementCategory = 'streak' | 'habit' | 'xp' | 'social' | 'special';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type RequirementType =
  | 'current_streak'
  | 'total_habit_completions'
  | 'total_xp'
  | 'friends_count'
  | 'root_habit_complete'
  | 'early_completion'
  | 'late_completion'
  | 'perfect_day';

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  iconName: string;
  category: AchievementCategory;
  tier: AchievementTier;
  requirementType: RequirementType;
  requirementValue: number;
  xpReward: number;
  pointsReward: number;
  isHidden: boolean;
  createdAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress: number;
  achievement?: Achievement; // Populated via join
}

export interface AchievementWithProgress extends Achievement {
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
}

export interface AchievementUnlockResult {
  newly_unlocked: number;
  achievements_unlocked: Array<{
    key: string;
    name: string;
    xp_reward: number;
    points_reward: number;
  }>;
}

export interface AchievementsState {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  achievementsWithProgress: AchievementWithProgress[];
  isLoading: boolean;
  error: string | null;
}
