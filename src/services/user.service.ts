import { User, UserStats } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { StorageService } from './storage';

/**
 * User data service
 */
export class UserService {
  static getUser(): User | null {
    return StorageService.get<User>(STORAGE_KEYS.USER);
  }

  static setUser(user: User): boolean {
    return StorageService.set(STORAGE_KEYS.USER, user);
  }

  static updatePoints(delta: number): boolean {
    const user = this.getUser();
    if (!user) return false;

    user.points += delta;
    return this.setUser(user);
  }

  static updateXP(xp: number): boolean {
    const user = this.getUser();
    if (!user) return false;

    user.totalXPEarned += xp;
    return this.setUser(user);
  }

  static initializeUser(): User {
    const defaultUser: User = {
      id: crypto.randomUUID(),
      points: 0,
      totalXPEarned: 0,
      level: 1, // Start at level 1
      joinedAt: new Date(),
    };

    this.setUser(defaultUser);
    return defaultUser;
  }

  static getUserStats(): UserStats {
    const user = this.getUser();
    // TODO: Calculate from actual data
    return {
      totalHabitsCompleted: 0,
      totalPointsEarned: user?.totalXPEarned || 0,
      totalPointsSpent: 0,
      currentBalance: user?.points || 0,
      currentStreak: 0,
      longestStreak: 0,
    };
  }
}
