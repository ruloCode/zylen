/**
 * Achievements Service - Supabase Implementation
 *
 * Manages the achievement/badge system including unlocking achievements,
 * tracking progress, and rewarding users.
 */

import { supabase } from '@/lib/supabase';
import type {
  Achievement,
  UserAchievement,
  AchievementWithProgress,
  AchievementUnlockResult,
  AchievementClaimResult,
} from '@/types/achievement';
import { getAuthUserId } from './utils';

export class AchievementsService {
  /**
   * Get all achievements (system-wide)
   */
  static async getAllAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category, tier, requirement_value');

      if (error) {
        console.error('Error in AchievementsService.getAllAchievements:', error);
        throw new Error('Failed to get achievements');
      }

      return data.map((row) => ({
        id: row.id,
        key: row.key,
        name: row.name,
        description: row.description,
        iconName: row.icon_name,
        category: row.category,
        tier: row.tier,
        requirementType: row.requirement_type,
        requirementValue: row.requirement_value,
        xpReward: row.xp_reward,
        pointsReward: row.points_reward,
        isHidden: row.is_hidden,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('Error in AchievementsService.getAllAchievements:', error);
      throw error;
    }
  }

  /**
   * Get user's unlocked achievements
   */
  static async getUserAchievements(): Promise<UserAchievement[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        console.error('Error in AchievementsService.getUserAchievements:', error);
        throw new Error('Failed to get user achievements');
      }

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        achievementId: row.achievement_id,
        unlockedAt: row.unlocked_at,
        claimedAt: row.claimed_at,
        progress: row.progress,
        achievement: row.achievement ? {
          id: row.achievement.id,
          key: row.achievement.key,
          name: row.achievement.name,
          description: row.achievement.description,
          iconName: row.achievement.icon_name,
          category: row.achievement.category,
          tier: row.achievement.tier,
          requirementType: row.achievement.requirement_type,
          requirementValue: row.achievement.requirement_value,
          xpReward: row.achievement.xp_reward,
          pointsReward: row.achievement.points_reward,
          isHidden: row.achievement.is_hidden,
          createdAt: row.achievement.created_at,
        } : undefined,
      }));
    } catch (error) {
      console.error('Error in AchievementsService.getUserAchievements:', error);
      throw error;
    }
  }

  /**
   * Get all achievements with user's progress
   * This combines all achievements with unlock status
   */
  static async getAchievementsWithProgress(): Promise<AchievementWithProgress[]> {
    try {
      const userId = await getAuthUserId();

      const [allAchievements, userAchievements] = await Promise.all([
        this.getAllAchievements(),
        this.getUserAchievements(),
      ]);

      // Create a map of unlocked achievements
      const unlockedMap = new Map(
        userAchievements.map((ua) => [
          ua.achievementId,
          { unlockedAt: ua.unlockedAt, claimedAt: ua.claimedAt, progress: ua.progress },
        ])
      );

      // Combine achievements with unlock status
      return allAchievements.map((achievement) => {
        const unlockData = unlockedMap.get(achievement.id);
        return {
          ...achievement,
          unlocked: !!unlockData,
          unlockedAt: unlockData?.unlockedAt,
          claimedAt: unlockData?.claimedAt,
          progress: unlockData?.progress || 0,
        };
      });
    } catch (error) {
      console.error('Error in AchievementsService.getAchievementsWithProgress:', error);
      throw error;
    }
  }

  /**
   * Check and unlock achievements for the current user
   * This calls the Supabase function that checks all achievement conditions
   */
  static async checkAndUnlockAchievements(): Promise<AchievementUnlockResult> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .rpc('check_and_unlock_achievements', { p_user_id: userId })
        .single();

      if (error) {
        console.error('Error in AchievementsService.checkAndUnlockAchievements:', error);
        return { newly_unlocked: 0, achievements_unlocked: [] };
      }

      return data;
    } catch (error) {
      console.error('Error in AchievementsService.checkAndUnlockAchievements:', error);
      return { newly_unlocked: 0, achievements_unlocked: [] };
    }
  }

  /**
   * Get achievements by category
   */
  static async getAchievementsByCategory(
    category: string
  ): Promise<AchievementWithProgress[]> {
    try {
      const allAchievements = await this.getAchievementsWithProgress();
      return allAchievements.filter((a) => a.category === category);
    } catch (error) {
      console.error('Error in AchievementsService.getAchievementsByCategory:', error);
      throw error;
    }
  }

  /**
   * Get unlocked achievements count
   */
  static async getUnlockedCount(): Promise<number> {
    try {
      const userId = await getAuthUserId();

      const { count, error } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error in AchievementsService.getUnlockedCount:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in AchievementsService.getUnlockedCount:', error);
      return 0;
    }
  }

  /**
   * Get recently unlocked achievements (last 5)
   */
  static async getRecentlyUnlocked(): Promise<UserAchievement[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error in AchievementsService.getRecentlyUnlocked:', error);
        return [];
      }

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        achievementId: row.achievement_id,
        unlockedAt: row.unlocked_at,
        claimedAt: row.claimed_at,
        progress: row.progress,
        achievement: row.achievement ? {
          id: row.achievement.id,
          key: row.achievement.key,
          name: row.achievement.name,
          description: row.achievement.description,
          iconName: row.achievement.icon_name,
          category: row.achievement.category,
          tier: row.achievement.tier,
          requirementType: row.achievement.requirement_type,
          requirementValue: row.achievement.requirement_value,
          xpReward: row.achievement.xp_reward,
          pointsReward: row.achievement.points_reward,
          isHidden: row.achievement.is_hidden,
          createdAt: row.achievement.created_at,
        } : undefined,
      }));
    } catch (error) {
      console.error('Error in AchievementsService.getRecentlyUnlocked:', error);
      return [];
    }
  }

  /**
   * Claim an unlocked achievement and receive rewards
   */
  static async claimAchievement(achievementId: string): Promise<AchievementClaimResult> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .rpc('claim_achievement_reward', {
          p_user_id: userId,
          p_achievement_id: achievementId,
        })
        .single();

      if (error) {
        console.error('Error in AchievementsService.claimAchievement:', error);
        return {
          success: false,
          error: error.message || 'Failed to claim achievement',
        };
      }

      return data;
    } catch (error) {
      console.error('Error in AchievementsService.claimAchievement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to claim achievement',
      };
    }
  }

  /**
   * Get available achievements count (unlocked but not claimed)
   */
  static async getAvailableCount(): Promise<number> {
    try {
      const userId = await getAuthUserId();

      const { count, error } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('claimed_at', null);

      if (error) {
        console.error('Error in AchievementsService.getAvailableCount:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in AchievementsService.getAvailableCount:', error);
      return 0;
    }
  }

  /**
   * Get claimed achievements count
   */
  static async getClaimedCount(): Promise<number> {
    try {
      const userId = await getAuthUserId();

      const { count, error } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('claimed_at', 'is', null);

      if (error) {
        console.error('Error in AchievementsService.getClaimedCount:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in AchievementsService.getClaimedCount:', error);
      return 0;
    }
  }
}
