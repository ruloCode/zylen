/**
 * ReminderSettings — card de Perfil para gestionar las notificaciones.
 *
 * Tres piezas:
 *  - Estado/solicitud del permiso del sistema (canales creados antes del
 *    prompt — requisito Android 13+; lo maneja NotificationsService).
 *  - Toggle "Coach de hábitos": recordatorios locales programados con el
 *    porqué de cada ritual (coachReminders.service).
 *  - Toggle "Aliados y Arena": push remota (registro del token FCM en
 *    Supabase vía push.service).
 * Per-habit toggles live in the habit detail sheet (Rituales → tap a habit).
 */

import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import {
  Bell,
  BellOff,
  BellRing,
  Compass,
  Info,
  Swords,
  type LucideIcon,
} from 'lucide-react-native';
import toast from '@/lib/toast';
import { NotificationsService } from '@/services/notifications.service';
import {
  isCoachPrefEnabled,
  setCoachPref,
  showCoachPreview,
  syncCoachReminders,
} from '@/services/coachReminders.service';
import {
  isPushPrefEnabled,
  registerPushToken,
  setPushPref,
  unregisterPushToken,
} from '@/services/push.service';
import { useHabits } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils/cn';

// Literal icon colors (lucide-react-native needs concrete values)
const GOLD_400 = 'hsl(40, 95%, 58%)';
const SUCCESS_400 = '#66CB8F';
const RED_400 = '#F56565';
const WHITE_60 = 'rgba(255,255,255,0.6)';
const WHITE_40 = 'rgba(255,255,255,0.4)';
const WHITE_50 = 'rgba(255,255,255,0.5)';
const TEAL_400 = '#2dd4bf';
const AMBER_400 = '#fbbf24';

const SWITCH_TRACK = { false: 'rgba(255,255,255,0.15)', true: 'rgba(20,184,166,0.6)' };

interface StatusMeta {
  icon: LucideIcon;
  text: string;
  tone: string;
  color: string;
}

export function ReminderSettings() {
  const { t, language } = useLocale();
  const { habits } = useHabits();
  const [permission, setPermission] = useState(NotificationsService.getPermission());
  const [coachOn, setCoachOn] = useState(isCoachPrefEnabled());
  const [pushOn, setPushOn] = useState(isPushPrefEnabled());

  const remindersOn = habits.filter((h) => h.reminderEnabled).length;

  /** Pide el permiso si hace falta; devuelve true si quedó otorgado. */
  const ensurePermission = async (): Promise<boolean> => {
    const result = await NotificationsService.requestPermission();
    setPermission(result);
    if (result === 'denied') toast.error(t('reminders.denied'));
    return result === 'granted';
  };

  const handleEnable = async (): Promise<void> => {
    if (await ensurePermission()) {
      toast.success(t('reminders.granted'));
      void syncCoachReminders(habits, t, isCoachPrefEnabled());
      if (isPushPrefEnabled()) void registerPushToken(language);
      void showCoachPreview(habits, t);
    }
  };

  const handleCoachToggle = async (value: boolean): Promise<void> => {
    setCoachOn(value);
    setCoachPref(value);
    if (value && !(await ensurePermission())) {
      setCoachOn(false);
      setCoachPref(false);
      return;
    }
    void syncCoachReminders(habits, t, value);
  };

  const handlePushToggle = async (value: boolean): Promise<void> => {
    setPushOn(value);
    setPushPref(value);
    if (value) {
      if (!(await ensurePermission())) {
        setPushOn(false);
        setPushPref(false);
        return;
      }
      void registerPushToken(language);
    } else {
      void unregisterPushToken();
    }
  };

  const statusMeta: StatusMeta =
    (
      {
        granted: {
          icon: BellRing,
          text: t('reminders.statusGranted'),
          tone: 'bg-success-500/15',
          color: SUCCESS_400,
        },
        denied: {
          icon: BellOff,
          text: t('reminders.statusDenied'),
          tone: 'bg-danger-500/15',
          color: RED_400,
        },
        default: {
          icon: Bell,
          text: t('reminders.statusDefault'),
          tone: 'bg-white/10',
          color: WHITE_60,
        },
        unsupported: {
          icon: BellOff,
          text: t('reminders.statusUnsupported'),
          tone: 'bg-white/10',
          color: WHITE_40,
        },
      } as Record<string, StatusMeta>
    )[permission] ?? {
      icon: Bell,
      text: t('reminders.statusDefault'),
      tone: 'bg-white/10',
      color: WHITE_60,
    };

  const StatusIcon = statusMeta.icon;
  const blocked = permission === 'denied' || permission === 'unsupported';

  return (
    <View className="mb-4 rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)] p-5">
      <View className="mb-3 flex-row items-center gap-2">
        <Bell size={18} color={GOLD_400} />
        <Text className="text-lg font-bold text-white">{t('reminders.title')}</Text>
      </View>

      {/* Permiso del sistema */}
      <View className="mb-4 flex-row items-center gap-3">
        <View
          className={cn(
            'h-11 w-11 shrink-0 items-center justify-center rounded-full',
            statusMeta.tone
          )}
        >
          <StatusIcon size={20} color={statusMeta.color} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-white">{statusMeta.text}</Text>
          <Text className="mt-0.5 text-xs text-white/55">
            {t('reminders.habitsWithReminder', { count: remindersOn })}
          </Text>
        </View>
        {permission === 'default' && (
          <Pressable
            onPress={() => void handleEnable()}
            accessibilityRole="button"
            className="shrink-0 rounded-xl bg-teal-500 px-4 py-2 active:bg-teal-600"
          >
            <Text className="text-sm font-semibold text-white">{t('reminders.enable')}</Text>
          </Pressable>
        )}
      </View>

      {/* Coach de hábitos (recordatorios locales programados) */}
      <View className="flex-row items-center gap-3 border-t border-white/10 py-3">
        <Compass size={18} color={TEAL_400} />
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-white">
            {t('reminders.coachToggle')}
          </Text>
          <Text className="mt-0.5 text-xs leading-snug text-white/55">
            {t('reminders.coachToggleHint')}
          </Text>
        </View>
        <Switch
          value={coachOn && !blocked}
          disabled={blocked}
          onValueChange={(value) => void handleCoachToggle(value)}
          trackColor={SWITCH_TRACK}
          thumbColor={coachOn && !blocked ? TEAL_400 : '#f4f4f5'}
          accessibilityLabel={t('reminders.coachToggle')}
        />
      </View>

      {/* Push social (aliados + arena) */}
      <View className="flex-row items-center gap-3 border-t border-white/10 py-3">
        <Swords size={18} color={AMBER_400} />
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-white">
            {t('reminders.pushToggle')}
          </Text>
          <Text className="mt-0.5 text-xs leading-snug text-white/55">
            {t('reminders.pushToggleHint')}
          </Text>
        </View>
        <Switch
          value={pushOn && !blocked}
          disabled={blocked}
          onValueChange={(value) => void handlePushToggle(value)}
          trackColor={SWITCH_TRACK}
          thumbColor={pushOn && !blocked ? AMBER_400 : '#f4f4f5'}
          accessibilityLabel={t('reminders.pushToggle')}
        />
      </View>

      <View className="mt-1 flex-row items-start gap-2 border-t border-white/10 pt-3">
        <Info size={14} color={WHITE_50} style={{ marginTop: 2 }} />
        <Text className="flex-1 text-xs leading-relaxed text-white/50">
          {t('reminders.limitationsHint')}
        </Text>
        {permission === 'granted' && (
          <Pressable
            onPress={() => void showCoachPreview(habits, t)}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text className="text-xs font-semibold text-teal-300">
              {t('reminders.preview')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default ReminderSettings;
