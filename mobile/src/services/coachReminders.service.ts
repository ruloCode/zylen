/**
 * Coach de hábitos — recordatorios locales programados.
 *
 * A diferencia de un recordatorio genérico ("te falta X"), el Mentor recuerda
 * QUÉ ritual toca y POR QUÉ vale la pena: cada notificación lleva una línea
 * de la ciencia del catálogo (habitCatalog.<slug>.science/shortTerm/tips),
 * rotada por día para no repetirse.
 *
 * Estrategia de programación (se re-sincroniza en cada apertura de la app,
 * al completar/editar hábitos y en el reset diario):
 *   - Una notificación por franja (mañana/tarde/noche/anytime) y por día,
 *     para los próximos DAYS_AHEAD días — nada de spam por hábito.
 *   - La franja destaca UN hábito (rota por día) y menciona cuántos más
 *     esperan; hoy solo cuentan los no completados.
 *   - Identificadores `coach-<slot>-<yyyymmdd>` → cancelación selectiva sin
 *     tocar otras notificaciones programadas.
 *   - Sobreviven reboots (expo-notifications trae RECEIVE_BOOT_COMPLETED).
 */

import * as Notifications from 'expo-notifications';
import type { HabitWithCompletion } from '@/services/supabase/habits.service';
import type { TimeOfDay } from '@/types';
import { findCatalogEntry } from '@/constants/habitCatalog';
import { CHANNELS, NotificationsService, REMINDER_HOURS } from './notifications.service';
import { StorageService } from './storage';

/** Días hacia adelante con recordatorios ya programados (colchón si el
 *  usuario no abre la app; se regeneran en cada sync). */
const DAYS_AHEAD = 3;

const COACH_PREFIX = 'coach-';
const COACH_PREF_KEY = 'zylen_coach_reminders_enabled';

/** Preferencia local del coach (Perfil → notificaciones). Default: activo. */
export function isCoachPrefEnabled(): boolean {
  return StorageService.get<boolean>(COACH_PREF_KEY) ?? true;
}

export function setCoachPref(enabled: boolean): void {
  StorageService.set(COACH_PREF_KEY, enabled);
}

/** Firma mínima compatible con el `t` de useLocale / i18next. */
export type Translator = (key: string, options?: Record<string, unknown>) => string;

const SLOT_ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'anytime'];

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

function ymd(date: Date): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function pickFrom(t: Translator, key: string, seed: number): string | null {
  const list = (t as unknown as (k: string, o: { returnObjects: true }) => unknown)(key, {
    returnObjects: true,
  });
  if (!Array.isArray(list) || list.length === 0) return null;
  return String(list[seed % list.length]);
}

function truncate(line: string, max = 150): string {
  if (line.length <= max) return line;
  return `${line.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Compone el mensaje del Mentor para un hábito: título rotado + una línea
 * del "porqué" (ciencia, beneficio o consejo del catálogo; genérica si el
 * hábito no matchea el catálogo).
 */
export function composeCoachMessage(
  habit: HabitWithCompletion,
  othersCount: number,
  date: Date,
  t: Translator
): { title: string; body: string } {
  const seed = dayOfYear(date) + habit.name.length;

  const title =
    pickFrom(t, 'coach.notifications.titles', seed)?.replace('{{habit}}', habit.name) ??
    habit.name;

  let why: string | null = null;
  const entry = findCatalogEntry(habit.name);
  if (entry) {
    const base = `habitCatalog.${entry.slug}`;
    const kind = seed % 3;
    if (kind === 0) {
      const science = t(`${base}.science`);
      const firstSentence = science.split('. ')[0];
      why = t('coach.notifications.whyScience', {
        line: truncate(firstSentence.endsWith('.') ? firstSentence : `${firstSentence}.`),
      });
    } else if (kind === 1) {
      const line = pickFrom(t, `${base}.shortTerm`, seed);
      if (line) why = t('coach.notifications.whyBenefit', { line: truncate(line) });
    } else {
      const line = pickFrom(t, `${base}.tips`, seed);
      if (line) why = t('coach.notifications.whyTip', { line: truncate(line) });
    }
  }
  if (!why) {
    why =
      pickFrom(t, 'coach.notifications.generic', seed)?.replace('{{habit}}', habit.name) ??
      habit.name;
  }

  const body =
    othersCount > 1 ? `${why} ${t('coach.notifications.others', { count: othersCount - 1 })}` : why;

  return { title, body };
}

async function cancelCoachNotifications(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(COACH_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch (error) {
    console.warn('Failed to cancel coach notifications:', error);
  }
}

/**
 * Re-sincroniza todos los recordatorios del coach con el estado actual de
 * los hábitos. Idempotente: cancela lo programado y lo vuelve a generar.
 */
export async function syncCoachReminders(
  habits: HabitWithCompletion[],
  t: Translator,
  enabled: boolean
): Promise<void> {
  await cancelCoachNotifications();
  if (!enabled) return;
  if ((await NotificationsService.getPermissionAsync()) !== 'granted') return;

  const withReminder = habits.filter((h) => h.reminderEnabled);
  if (withReminder.length === 0) return;

  const now = new Date();

  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    for (const slot of SLOT_ORDER) {
      const fireAt = new Date(now);
      fireAt.setDate(fireAt.getDate() + offset);
      fireAt.setHours(REMINDER_HOURS[slot], 0, 0, 0);
      if (fireAt.getTime() <= now.getTime()) continue;

      const inSlot = withReminder.filter((h) => (h.timeOfDay ?? 'anytime') === slot);
      // Hoy: solo hábitos aún pendientes. Días futuros: todos (se re-sincroniza
      // al abrir la app, así que "mañana" siempre parte completo).
      const pending = offset === 0 ? inSlot.filter((h) => !h.completedToday) : inSlot;
      if (pending.length === 0) continue;

      const featured = pending[dayOfYear(fireAt) % pending.length];
      const { title, body } = composeCoachMessage(featured, pending.length, fireAt, t);

      try {
        await Notifications.scheduleNotificationAsync({
          identifier: `${COACH_PREFIX}${slot}-${ymd(fireAt)}`,
          content: {
            title,
            body,
            data: { url: '/habits', type: 'coach' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireAt,
            channelId: CHANNELS.coach,
          },
        });
      } catch (error) {
        console.warn(`Failed to schedule coach reminder (${slot}):`, error);
      }
    }
  }
}

/** Muestra un ejemplo real del coach (botón "probar" en ajustes). */
export async function showCoachPreview(
  habits: HabitWithCompletion[],
  t: Translator
): Promise<void> {
  const sample =
    habits.find((h) => h.reminderEnabled && !h.completedToday) ??
    habits.find((h) => h.reminderEnabled) ??
    habits[0];
  if (!sample) return;
  const { title, body } = composeCoachMessage(sample, 1, new Date(), t);
  await NotificationsService.show(title, body, 'coach-preview');
}
