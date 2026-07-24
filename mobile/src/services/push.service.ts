/**
 * Push remota — registro del token FCM del dispositivo en Supabase.
 *
 * El backend (Edge Function send-push) envía directo por FCM HTTP v1, así
 * que aquí se registra el token NATIVO (getDevicePushTokenAsync), no el
 * ExpoPushToken. Requiere google-services.json en el build (ya cableado en
 * app.json → android.googleServicesFile).
 *
 * El token se guarda en push_tokens vía RPC register_push_token (multi-
 * device, re-asigna tokens que cambiaron de cuenta) junto con el locale,
 * que el backend usa para localizar el texto de la notificación.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { ENV } from '@/lib/env';
import { StorageService } from './storage';
import { ensureNotificationChannels, NotificationsService } from './notifications.service';

const TOKEN_KEY = 'zylen_push_token';
const PREF_KEY = 'zylen_push_enabled';

/** Preferencia local del usuario (Perfil → notificaciones). Default: activo. */
export function isPushPrefEnabled(): boolean {
  return StorageService.get<boolean>(PREF_KEY) ?? true;
}

export function setPushPref(enabled: boolean): void {
  StorageService.set(PREF_KEY, enabled);
}

/**
 * Registra (o refresca) el token del dispositivo en push_tokens.
 * No pide permisos: asume que ya están otorgados (lo gestiona la UI).
 * Silencioso ante errores — sin Play Services o en emulador simplemente
 * no hay push.
 */
export async function registerPushToken(locale: string): Promise<boolean> {
  if (ENV.SKIP_AUTH) return false;
  if ((await NotificationsService.getPermissionAsync()) !== 'granted') return false;

  try {
    await ensureNotificationChannels();
    const device = await Notifications.getDevicePushTokenAsync();
    const token = typeof device.data === 'string' ? device.data : null;
    if (!token) return false;

    const { error } = await supabase.rpc('register_push_token', {
      p_token: token,
      p_platform: Platform.OS === 'ios' ? 'ios' : 'android',
      p_locale: locale,
    });
    if (error) throw error;

    StorageService.set(TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.warn('Push token registration failed:', error);
    return false;
  }
}

/** Da de baja el token del dispositivo (toggle off en ajustes / logout). */
export async function unregisterPushToken(): Promise<void> {
  const token = StorageService.get<string>(TOKEN_KEY);
  if (!token) return;
  try {
    const { error } = await supabase.rpc('unregister_push_token', { p_token: token });
    if (error) throw error;
    StorageService.remove(TOKEN_KEY);
  } catch (error) {
    console.warn('Push token unregistration failed:', error);
  }
}

/**
 * FCM puede rotar el token en cualquier momento; re-registra al vuelo.
 * Llamar una vez tras autenticar; devolver la suscripción para limpiar.
 */
export function watchPushTokenRotation(locale: string): { remove: () => void } {
  return Notifications.addPushTokenListener(() => {
    if (isPushPrefEnabled()) void registerPushToken(locale);
  });
}
