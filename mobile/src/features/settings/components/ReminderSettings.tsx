/**
 * ReminderSettings — Profile card to manage local habit reminders.
 * React Native port: requests the notification permission through the
 * expo-notifications-backed NotificationsService and shows the current
 * status, plus a count of habits with reminders enabled. Per-habit toggles
 * live in the habit detail sheet (Rituales → tap a habit).
 */

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bell, BellOff, BellRing, Info, type LucideIcon } from 'lucide-react-native';
import toast from '@/lib/toast';
import { NotificationsService } from '@/services/notifications.service';
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

interface StatusMeta {
  icon: LucideIcon;
  text: string;
  tone: string;
  color: string;
}

export function ReminderSettings() {
  const { t } = useLocale();
  const { habits } = useHabits();
  const [permission, setPermission] = useState(NotificationsService.getPermission());

  const remindersOn = habits.filter((h) => h.reminderEnabled).length;

  const handleEnable = async (): Promise<void> => {
    const result = await NotificationsService.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      toast.success(t('reminders.granted'));
      void NotificationsService.show(
        t('reminders.notificationTitle'),
        t('reminders.testBody')
      );
    } else if (result === 'denied') {
      toast.error(t('reminders.denied'));
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

  return (
    <View className="mb-4 rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)] p-5">
      <View className="mb-3 flex-row items-center gap-2">
        <Bell size={18} color={GOLD_400} />
        <Text className="text-lg font-bold text-white">{t('reminders.title')}</Text>
      </View>

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

      <View className="flex-row items-start gap-2">
        <Info size={14} color={WHITE_50} style={{ marginTop: 2 }} />
        <Text className="flex-1 text-xs leading-relaxed text-white/50">
          {t('reminders.limitationsHint')}
        </Text>
      </View>
    </View>
  );
}

export default ReminderSettings;
