/**
 * HabitDetailSheet — bottom sheet with habit details and quick actions.
 * Lets the user change the time of day and reminder inline, and jump to
 * analytics, full edit, relapse (quit habits) or delete. (React Native port:
 * window.confirm → Alert.alert; the science sheet stacks as a nested Modal.)
 */

import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import {
  X,
  Sun,
  CloudSun,
  Moon,
  LayoutGrid,
  Bell,
  BellOff,
  TrendingUp,
  Pencil,
  Trash2,
  ShieldAlert,
  Check,
  BarChart3,
  Ban,
  FlaskConical,
} from 'lucide-react-native';
import toast from '@/lib/toast';
import { useHabits } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { HabitScienceSheet } from './HabitScienceSheet';
import { SheetShell } from './SheetShell';
import { findCatalogEntry } from '@/constants/habitCatalog';
import { HABIT_ICONS } from './IconSelector';
import type { HabitWithCompletion } from '@/services/supabase/habits.service';
import type { TimeOfDay } from '@/types';
import { cn } from '@/utils/cn';

const TEAL_400 = '#2DD4BF';
const TEAL_300 = '#5EEAD4';
const CYAN_400 = '#22D3EE';
const GOLD_400 = '#F6AD37';
const RED_400 = '#F87171';
const WHITE = '#FFFFFF';
const WHITE_50 = 'rgba(255,255,255,0.5)';
const WHITE_60 = 'rgba(255,255,255,0.6)';
const WHITE_70 = 'rgba(255,255,255,0.7)';

interface HabitDetailSheetProps {
  habit: HabitWithCompletion;
  onClose: () => void;
  onOpenAnalytics: (id: string) => void;
  onOpenEdit: (id: string) => void;
  onRelapse: (id: string) => void;
}

export function HabitDetailSheet({
  habit,
  onClose,
  onOpenAnalytics,
  onOpenEdit,
  onRelapse,
}: HabitDetailSheetProps) {
  const { t } = useLocale();
  const { updateHabit, deleteHabit } = useHabits();
  const [saving, setSaving] = useState(false);
  const [isScienceOpen, setIsScienceOpen] = useState(false);

  // Science-backed catalog entry for this habit (matched by name)
  const catalogEntry = findCatalogEntry(habit.name);

  const Icon = HABIT_ICONS[habit.iconName];
  const habitType = habit.habitType || 'check';
  const timeOfDay = habit.timeOfDay || 'anytime';
  const reminderEnabled = habit.reminderEnabled ?? false;
  const accent = habit.color || '#2dd4bf';

  const typeMeta = {
    check: { icon: Check, label: t('habitForm.typeCheck') },
    measurable: { icon: BarChart3, label: t('habitForm.typeMeasurable') },
    quit: { icon: Ban, label: t('habitForm.typeQuit') },
  }[habitType];
  const TypeIcon = typeMeta.icon;

  const handleTimeOfDay = async (tod: TimeOfDay): Promise<void> => {
    if (tod === timeOfDay || saving) return;
    setSaving(true);
    try {
      await updateHabit(habit.id, { timeOfDay: tod });
      toast.success(t('habitDetail.saved'));
    } catch {
      toast.error(t('errors.habitUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReminder = async (): Promise<void> => {
    if (saving) return;
    setSaving(true);
    try {
      await updateHabit(habit.id, { reminderEnabled: !reminderEnabled });
      toast.success(t('habitDetail.saved'));
    } catch {
      toast.error(t('errors.habitUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (): void => {
    Alert.alert(t('habitDetail.delete'), t('habitDetail.deleteConfirm'), [
      { text: t('actions.cancel'), style: 'cancel' },
      {
        text: t('habitDetail.delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteHabit(habit.id);
              toast.success(t('habitDetail.deleted'));
              onClose();
            } catch {
              toast.error(t('errors.habitDeleteFailed'));
            }
          })();
        },
      },
    ]);
  };

  const timeOptions: { key: TimeOfDay; icon: typeof Sun; label: string }[] = [
    { key: 'anytime', icon: LayoutGrid, label: t('habitForm.timeAnytime') },
    { key: 'morning', icon: Sun, label: t('habitForm.timeMorning') },
    { key: 'afternoon', icon: CloudSun, label: t('habitForm.timeAfternoon') },
    { key: 'evening', icon: Moon, label: t('habitForm.timeEvening') },
  ];

  return (
    <SheetShell onClose={onClose} accessibilityLabel={t('habitDetail.title')}>
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-white/10 px-5 py-4">
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${accent}26` }}
        >
          {Icon && <Icon size={24} color={accent} />}
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-lg font-bold text-white">
            {habit.name}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <TypeIcon size={14} color={WHITE_50} />
            <Text className="text-xs text-white/50">
              {typeMeta.label} · {habit.xp} XP
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onClose}
          className="h-9 w-9 items-center justify-center rounded-xl bg-white/10 active:bg-white/15"
          accessibilityRole="button"
          accessibilityLabel={t('actions.cancel')}
        >
          <X size={20} color={WHITE_70} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        {/* Time of day (inline edit) */}
        <View>
          <Text className="mb-2 text-sm font-semibold text-white">
            {t('habitForm.timeOfDay')}
          </Text>
          <View className="flex-row gap-2">
            {timeOptions.map(({ key, icon: OptIcon, label }) => {
              const active = timeOfDay === key;
              return (
                <Pressable
                  key={key}
                  disabled={saving}
                  onPress={() => handleTimeOfDay(key)}
                  className={cn(
                    'flex-1 items-center gap-1.5 rounded-2xl border-2 p-2.5',
                    active ? 'border-teal-400 bg-teal-500/15' : 'border-white/10 bg-white/5',
                    saving && 'opacity-60'
                  )}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled: saving }}
                >
                  <OptIcon size={20} color={active ? WHITE : WHITE_60} />
                  <Text
                    className={cn(
                      'text-center text-[11px] font-semibold leading-tight',
                      active ? 'text-white' : 'text-white/60'
                    )}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Reminder toggle */}
        <Pressable
          disabled={saving}
          onPress={handleToggleReminder}
          className={cn(
            'w-full flex-row items-center gap-3 rounded-2xl border p-4',
            reminderEnabled ? 'border-gold-400/40 bg-gold-500/10' : 'border-white/10 bg-white/5'
          )}
          accessibilityRole="switch"
          accessibilityState={{ checked: reminderEnabled, disabled: saving }}
        >
          <View
            className={cn(
              'h-10 w-10 items-center justify-center rounded-xl',
              reminderEnabled ? 'bg-gold-500/20' : 'bg-white/10'
            )}
          >
            {reminderEnabled ? (
              <Bell size={20} color={GOLD_400} />
            ) : (
              <BellOff size={20} color={WHITE_50} />
            )}
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold text-white">{t('habitDetail.reminder')}</Text>
            <Text className="mt-0.5 text-xs text-white/55">{t('habitDetail.reminderHint')}</Text>
          </View>
          <View
            className={cn(
              'relative h-6 w-11 rounded-full',
              reminderEnabled ? 'bg-gold-500' : 'bg-white/15'
            )}
          >
            <View
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white"
              style={{ left: reminderEnabled ? 22 : 2 }}
            />
          </View>
        </Pressable>

        {/* Actions */}
        <View className="gap-2.5">
          {catalogEntry && (
            <Pressable
              onPress={() => setIsScienceOpen(true)}
              className="w-full flex-row items-center gap-3 rounded-2xl border border-teal-400/30 bg-teal-500/10 p-4 active:border-teal-400/60"
              accessibilityRole="button"
            >
              <FlaskConical size={20} color={TEAL_300} />
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-semibold text-white">
                  {t('habitScience.learnAboutHabit')}
                </Text>
                <Text numberOfLines={1} className="mt-0.5 text-xs text-white/55">
                  {(t as (k: string) => string)(`habitCatalog.${catalogEntry.slug}.tagline`)}
                </Text>
              </View>
            </Pressable>
          )}

          <Pressable
            onPress={() => onOpenAnalytics(habit.id)}
            className="w-full flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 active:border-teal-400/40"
            accessibilityRole="button"
          >
            <TrendingUp size={20} color={TEAL_400} />
            <Text className="text-sm font-semibold text-white">
              {t('habitDetail.viewAnalytics')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onOpenEdit(habit.id)}
            className="w-full flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 active:border-white/30"
            accessibilityRole="button"
          >
            <Pencil size={20} color={WHITE_70} />
            <Text className="text-sm font-semibold text-white">{t('habitDetail.edit')}</Text>
          </Pressable>

          {habitType === 'quit' && (
            <Pressable
              onPress={() => onRelapse(habit.id)}
              className="w-full flex-row items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4 active:border-cyan-400/50"
              accessibilityRole="button"
            >
              <ShieldAlert size={20} color={CYAN_400} />
              <Text className="text-sm font-semibold text-white">
                {t('habitDetail.relapse')}
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleDelete}
            className="w-full flex-row items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/5 p-4 active:border-red-400/50"
            accessibilityRole="button"
          >
            <Trash2 size={20} color={RED_400} />
            <Text className="text-sm font-semibold text-red-300">{t('habitDetail.delete')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Science sheet stacked above the detail sheet */}
      {isScienceOpen && catalogEntry && (
        <HabitScienceSheet entry={catalogEntry} onClose={() => setIsScienceOpen(false)} />
      )}
    </SheetShell>
  );
}

export default HabitDetailSheet;
