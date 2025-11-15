import { Habit, HabitCompletion } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { StorageService } from './storage';

/**
 * Habits data service
 */
export class HabitsService {
  static getHabits(): Habit[] {
    return StorageService.get<Habit[]>(STORAGE_KEYS.HABITS) || [];
  }

  static setHabits(habits: Habit[]): boolean {
    return StorageService.set(STORAGE_KEYS.HABITS, habits);
  }

  static addHabit(habit: Habit): boolean {
    const habits = this.getHabits();
    habits.push(habit);
    return this.setHabits(habits);
  }

  static updateHabit(id: string, updates: Partial<Habit>): boolean {
    const habits = this.getHabits();
    const index = habits.findIndex((h) => h.id === id);

    if (index === -1) return false;

    habits[index] = { ...habits[index], ...updates };
    return this.setHabits(habits);
  }

  static deleteHabit(id: string): boolean {
    const habits = this.getHabits();
    const filtered = habits.filter((h) => h.id !== id);
    return this.setHabits(filtered);
  }

  static toggleHabit(id: string, completed: boolean): boolean {
    const habits = this.getHabits();
    const index = habits.findIndex((h) => h.id === id);

    if (index === -1) return false;

    habits[index].completed = completed;
    habits[index].completedAt = completed ? new Date() : undefined;

    return this.setHabits(habits);
  }

  static resetDailyHabits(): boolean {
    const habits = this.getHabits();
    const reset = habits.map((h) => ({
      ...h,
      completed: false,
      completedAt: undefined,
    }));
    return this.setHabits(reset);
  }

  static getCompletedHabits(): Habit[] {
    return this.getHabits().filter((h) => h.completed);
  }

  static getTotalXPEarned(): number {
    return this.getCompletedHabits().reduce((sum, h) => sum + h.xp, 0);
  }

  static getCompletionsByDate(date: Date): HabitCompletion[] {
    // TODO: Implement history tracking
    return [];
  }
}
