/**
 * Local reminder notifications (PWA + Notification API, no push server).
 *
 * Honest limitations: without a push backend, notifications only fire while
 * the app (or installed PWA) is open or returns to the foreground. On iOS
 * there is no background delivery at all for this approach. The check runs
 * on app open and on visibilitychange; each habit is notified at most once
 * per day (localStorage de-dupe).
 */

import type { HabitWithCompletion } from '@/services/supabase/habits.service';
import type { TimeOfDay } from '@/types';
import { StorageService } from './storage';

/** Local hour (0-23) at which each slot's reminder becomes due */
export const REMINDER_HOURS: Record<TimeOfDay, number> = {
  morning: 8,
  afternoon: 14,
  evening: 19,
  anytime: 12,
};

const NOTIFIED_KEY = 'everlight_reminders_notified';

type NotifiedMap = Record<string, string>; // habitId -> YYYY-MM-DD last notified

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export class NotificationsService {
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  static getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  static async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    return Notification.requestPermission();
  }

  /**
   * Show a notification, preferring the service worker registration
   * (required on Android Chrome; `new Notification()` throws there).
   */
  static async show(title: string, body: string, tag?: string): Promise<void> {
    if (this.getPermission() !== 'granted') return;

    const options: NotificationOptions = {
      body,
      tag,
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-32x32.png',
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification(title, options);
          return;
        }
      }
      new Notification(title, options);
    } catch (error) {
      console.warn('Failed to show notification:', error);
    }
  }

  /**
   * Notify pending habits whose time-of-day slot already started today.
   * Each habit is notified at most once per local day.
   *
   * @returns number of notifications shown
   */
  static async checkPendingReminders(
    habits: HabitWithCompletion[],
    title: string,
    bodyTemplate: (habitName: string) => string
  ): Promise<number> {
    if (this.getPermission() !== 'granted') return 0;

    const hour = new Date().getHours();
    const today = todayKey();
    const notified = StorageService.get<NotifiedMap>(NOTIFIED_KEY) ?? {};
    let shown = 0;

    for (const habit of habits) {
      if (!habit.reminderEnabled || habit.completedToday) continue;
      const slot = (habit.timeOfDay ?? 'anytime') as TimeOfDay;
      if (hour < REMINDER_HOURS[slot]) continue;
      if (notified[habit.id] === today) continue;

      await this.show(title, bodyTemplate(habit.name), `reminder-${habit.id}`);
      notified[habit.id] = today;
      shown++;
    }

    if (shown > 0) {
      StorageService.set(NOTIFIED_KEY, notified);
    }
    return shown;
  }
}
