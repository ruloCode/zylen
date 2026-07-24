/**
 * Notifications core (expo-notifications).
 *
 * Capa base compartida por los dos sistemas de notificación de la app:
 *   - Coach local: recordatorios de hábitos programados en el dispositivo
 *     (ver coachReminders.service.ts) — funcionan con la app cerrada.
 *   - Push remota: eventos sociales (aliados/arena) enviados por la Edge
 *     Function send-push vía FCM (ver push.service.ts).
 *
 * Aquí viven: canales Android, permisos (con el canal creado ANTES del
 * prompt — requisito de Android 13+), y `show()` para avisos inmediatos
 * (p. ej. fin de sesión de enfoque).
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { TimeOfDay } from '@/types';

/** Local hour (0-23) at which each slot's reminder becomes due */
export const REMINDER_HOURS: Record<TimeOfDay, number> = {
  morning: 8,
  afternoon: 14,
  evening: 19,
  anytime: 12,
};

/** Android notification channels (deben coincidir con la Edge Function send-push) */
export const CHANNELS = {
  coach: 'coach',
  social: 'social',
  arena: 'arena',
} as const;

/** Mirrors the web Notification.permission values (+ 'unsupported'). */
export type ReminderPermission = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Conversación de aliados actualmente ABIERTA y enfocada: sus push de
 * chat_message no muestran banner (el mensaje ya está en pantalla vía
 * Realtime). La registra/limpia la pantalla AllyChat.
 */
let activeChatConversationId: string | null = null;

export function setActiveChatConversation(conversationId: string | null): void {
  activeChatConversationId = conversationId;
}

// Show alerts even while the app is foregrounded (the web page always shows
// its own notifications; without this, foreground notifications are silent).
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const url = notification.request.content.data?.url;
    const suppress =
      typeof url === 'string' &&
      activeChatConversationId !== null &&
      url === `/messages/${activeChatConversationId}`;
    return {
      shouldShowBanner: !suppress,
      shouldShowList: !suppress,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});

let channelsReady = false;

/**
 * Crea los canales Android una sola vez. En Android 13+ el prompt de
 * POST_NOTIFICATIONS solo aparece si ya existe al menos un canal, así que
 * SIEMPRE debe llamarse antes de requestPermission().
 */
export async function ensureNotificationChannels(): Promise<void> {
  if (channelsReady || Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNELS.coach, {
      name: 'Coach de hábitos',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#14b8a6',
    });
    await Notifications.setNotificationChannelAsync(CHANNELS.social, {
      name: 'Aliados',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#14b8a6',
    });
    await Notifications.setNotificationChannelAsync(CHANNELS.arena, {
      name: 'Arena',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#f59e0b',
    });
    channelsReady = true;
  } catch (error) {
    console.warn('Failed to create notification channels:', error);
  }
}

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
    await ensureNotificationChannels();
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
      await ensureNotificationChannels();
      await Notifications.scheduleNotificationAsync({
        ...(tag ? { identifier: tag } : {}),
        content: { title, body },
        trigger: null, // deliver immediately
      });
    } catch (error) {
      console.warn('Failed to show notification:', error);
    }
  }
}
