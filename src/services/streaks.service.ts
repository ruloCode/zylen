import { Streak, StreakData } from '@/types';
import { STORAGE_KEYS, STREAK_CONFIG } from '@/constants';
import { StorageService } from './storage';

/**
 * Streaks data service
 */
export class StreaksService {
  static getStreak(): Streak | null {
    return StorageService.get<Streak>(STORAGE_KEYS.STREAKS);
  }

  static setStreak(streak: Streak): boolean {
    return StorageService.set(STORAGE_KEYS.STREAKS, streak);
  }

  static initializeStreak(): Streak {
    const defaultStreak: Streak = {
      currentStreak: 0,
      weeklyStreak: 0,
      longestStreak: 0,
      lastSevenDays: Array(STREAK_CONFIG.daysToTrack).fill(false),
    };

    this.setStreak(defaultStreak);
    return defaultStreak;
  }

  static updateStreakForToday(completed: boolean): boolean {
    const streak = this.getStreak() || this.initializeStreak();
    const today = new Date();

    // Update last seven days array
    streak.lastSevenDays.shift(); // Remove oldest day
    streak.lastSevenDays.push(completed); // Add today

    // Calculate current streak
    let currentStreak = 0;
    for (let i = streak.lastSevenDays.length - 1; i >= 0; i--) {
      if (streak.lastSevenDays[i]) {
        currentStreak++;
      } else {
        break;
      }
    }

    streak.currentStreak = currentStreak;
    streak.longestStreak = Math.max(streak.longestStreak, currentStreak);
    streak.lastCompletionDate = completed ? today : streak.lastCompletionDate;

    // Calculate weekly streak (days completed in last 7 days)
    streak.weeklyStreak = streak.lastSevenDays.filter(Boolean).length;

    return this.setStreak(streak);
  }

  static getStreakHistory(): StreakData[] {
    // TODO: Implement detailed history tracking
    return [];
  }

  static getStreakBonus(): number {
    const streak = this.getStreak();
    if (!streak) return 1.0;

    // Apply multiplier based on streak length
    const bonus = Math.min(
      1.0 + (streak.currentStreak * 0.1),
      STREAK_CONFIG.maxStreakBonus
    );

    return bonus;
  }
}
