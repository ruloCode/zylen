/**
 * Local reminder notifications (expo-notifications, no push server).
 *
 * RN port of the web Notification-API service. Reminders are presented
 * immediately (trigger: null) when the app runs the pending-reminders check —
 * on app open and on foreground return (see AppProvider); each habit is
 * notified at most once per day (kv-backed de-dupe). A foreground handler is
 * configured so reminders are visible while the app is open, mirroring the
 * web behavior.
 */

import * as Notifications from 'expo-notifications';
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

/** Mirrors the web Notification.permission values (+ 'unsupported'). */
export type ReminderPermission = 'granted' | 'denied' | 'default' | 'unsupported';

type NotifiedMap = Record<string, string>; // habitId -> YYYY-MM-DD last notified

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

// Show alerts even while the app is foregrounded (the web page always shows
// its own notifications; without this, foreground notifications are silent).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function mapPermission(status: Notifications.PermissionStatus): ReminderPermission {
  switch (status) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'denied';
    default:
      return 'default';
  }
}

/**
 * Cached permission so `getPermission()` stays synchronous like the web
 * Notification.permission. Refreshed at module load and after every
 * requestPermission()/async check.
 */
let cachedPermission: ReminderPermission = 'default';

async function refreshPermission(): Promise<ReminderPermission> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    cachedPermission = mapPermission(status);
  } catch (error) {
    console.warn('Failed to read notification permission:', error);
  }
  return cachedPermission;
}

// Prime the cache on module load (fire-and-forget).
void refreshPermission();

export class NotificationsService {
  static isSupported(): boolean {
    // expo-notifications is always available in the native app.
    return true;
  }

  /** Synchronous snapshot of the last known permission (web parity). */
  static getPermission(): ReminderPermission {
    if (!this.isSupported()) return 'unsupported';
    return cachedPermission;
  }

  /** Async, authoritative permission check. */
  static async getPermissionAsync(): Promise<ReminderPermission> {
    if (!this.isSupported()) return 'unsupported';
    return refreshPermission();
  }

  static async requestPermission(): Promise<ReminderPermission> {
    if (!this.isSupported()) return 'unsupported';
    const current = await refreshPermission();
    if (current === 'granted') return 'granted';
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      cachedPermission = mapPermission(status);
    } catch (error) {
      console.warn('Failed to request notification permission:', error);
    }
    return cachedPermission;
  }

  /**
   * Show a notification immediately (trigger: null). `tag` becomes the
   * request identifier so repeated reminders for the same habit replace
   * each other instead of stacking, matching the web `tag` semantics.
   */
  static async show(title: string, body: string, tag?: string): Promise<void> {
    if ((await this.getPermissionAsync()) !== 'granted') return;

    try {
      await Notifications.scheduleNotificationAsync({
        ...(tag ? { identifier: tag } : {}),
        content: { title, body },
        trigger: null, // deliver immediately
      });
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
    if ((await this.getPermissionAsync()) !== 'granted') return 0;

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
