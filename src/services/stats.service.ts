import { Habit, LifeArea, User } from '@/types';
import { StreaksService } from './streaks.service';
import { HabitsService } from './habits.service';
import { LifeAreasService } from './lifeAreas.service';
import { UserService } from './user.service';

export interface UserStats {
  totalHabitsCompleted: number;
  longestStreak: number;
  currentStreak: number;
  activeDaysCount: number;
  xpDistribution: LifeAreaXPDistribution[];
  dailyAverage: number;
  totalHabits: number;
  activeLifeAreas: number;
}

export interface LifeAreaXPDistribution {
  areaId: string;
  areaName: string;
  totalXP: number;
  level: number;
  percentage: number;
  color?: string;
}

/**
 * Statistics calculation service
 * Aggregates data from various services to provide user insights
 */
export class StatsService {
  /**
   * Get comprehensive user statistics
   */
  static getUserStats(): UserStats {
    const habits = HabitsService.getHabits();
    const streak = StreaksService.getStreak();
    const lifeAreas = LifeAreasService.getLifeAreas();
    const user = UserService.getUser();

    const totalHabitsCompleted = this.getTotalCompletions(habits);
    const longestStreak = streak?.longestStreak || 0;
    const currentStreak = streak?.currentStreak || 0;
    const activeDaysCount = this.getActiveDaysCount(streak?.lastSevenDays || []);
    const xpDistribution = this.getXPDistribution(lifeAreas);
    const dailyAverage = this.getDailyAverage(activeDaysCount, totalHabitsCompleted);
    const totalHabits = habits.length;
    const activeLifeAreas = lifeAreas.filter((area) => area.enabled).length;

    return {
      totalHabitsCompleted,
      longestStreak,
      currentStreak,
      activeDaysCount,
      xpDistribution,
      dailyAverage,
      totalHabits,
      activeLifeAreas,
    };
  }

  /**
   * Calculate total habit completions
   * Currently counts completed habits in the current day
   * TODO: Implement historical completion tracking
   */
  static getTotalCompletions(habits: Habit[]): number {
    return habits.filter((habit) => habit.completed).length;
  }

  /**
   * Count active days from streak data
   * Returns count of days with completed habits in last 7 days
   */
  static getActiveDaysCount(lastSevenDays: boolean[]): number {
    return lastSevenDays.filter(Boolean).length;
  }

  /**
   * Get XP distribution across life areas
   * Returns array with XP, level, and percentage for each enabled area
   */
  static getXPDistribution(lifeAreas: LifeArea[]): LifeAreaXPDistribution[] {
    const enabledAreas = lifeAreas.filter((area) => area.enabled);
    const totalXP = enabledAreas.reduce((sum, area) => sum + area.totalXP, 0);

    return enabledAreas
      .map((area) => ({
        areaId: area.id,
        areaName: typeof area.area === 'string' ? area.area : area.area,
        totalXP: area.totalXP,
        level: area.level,
        percentage: totalXP > 0 ? Math.round((area.totalXP / totalXP) * 100) : 0,
        color: area.color,
      }))
      .sort((a, b) => b.totalXP - a.totalXP); // Sort by XP descending
  }

  /**
   * Calculate daily average of habit completions
   * Based on active days in the last 7 days
   */
  static getDailyAverage(activeDays: number, totalCompletions: number): number {
    if (activeDays === 0) return 0;
    return Math.round((totalCompletions / activeDays) * 10) / 10; // Round to 1 decimal
  }

  /**
   * Get longest streak achieved
   */
  static getLongestStreak(): number {
    const streak = StreaksService.getStreak();
    return streak?.longestStreak || 0;
  }

  /**
   * Get current streak
   */
  static getCurrentStreak(): number {
    const streak = StreaksService.getStreak();
    return streak?.currentStreak || 0;
  }

  /**
   * Get total XP earned across all life areas
   */
  static getTotalXP(): number {
    return LifeAreasService.getTotalXP();
  }

  /**
   * Get total level across all enabled life areas
   */
  static getTotalLevel(): number {
    return LifeAreasService.getTotalLevel();
  }

  /**
   * Get user's join date and days since joining
   */
  static getDaysSinceJoining(): number {
    const user = UserService.getUser();
    if (!user?.joinedAt) return 0;

    const joinDate = new Date(user.joinedAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Get top performing life area (by XP)
   */
  static getTopLifeArea(): LifeAreaXPDistribution | null {
    const distribution = this.getXPDistribution(
      LifeAreasService.getLifeAreas()
    );
    return distribution.length > 0 ? distribution[0] : null;
  }
}
