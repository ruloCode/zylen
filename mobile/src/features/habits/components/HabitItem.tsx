/**
 * Zylen v2 HabitItem — AAA mobile tile (React Native port).
 * Premium glass card: accent icon tile, refined gold XP chip, streak flame,
 * XP burst celebration and tactile press states. Supports check / measurable
 * / quit habit types. Hover/glow-pulse effects from the web are replaced by
 * press states; decorative blurs are omitted (see PORTING.md).
 */

import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check, X, Flame, Shield, Timer, Zap } from 'lucide-react-native';
import { cn } from '@/utils';
import { XPBurst } from '@/components/effects/XPBurst';
import { HABIT_ICONS } from './IconSelector';
import { useLifeAreas } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import type { HabitType } from '@/types';
import type { HabitToggleResult } from '@/store/habitsSlice';

const iconMap = HABIT_ICONS;

// Concrete colors for lucide icons (className colors don't apply on native)
const TEAL_300 = '#5EEAD4';
const CYAN_300 = '#67E8F9';
const GOLD_300 = '#FBC956';
const WHITE = '#FFFFFF';
const WHITE_50 = 'rgba(255,255,255,0.5)';

interface HabitItemProps {
  id: string;
  name: string;
  iconName: string;
  xp: number;
  completedToday: boolean;
  lifeArea: string;
  streak?: number;
  habitType?: HabitType;
  unit?: string;
  dailyGoal?: number;
  todayValue?: number;
  /** may resolve with the toggle result so the XP burst shows the real award */
  onComplete: (id: string) => Promise<void | HabitToggleResult>;
  onUncomplete: (id: string) => Promise<void>;
  /** measurable: open the value/timer logger */
  onLog?: (id: string) => void;
  /** quit: register a relapse (resets streak) */
  onRelapse?: (id: string) => void;
  /** open the per-habit analytics modal */
  onOpenAnalytics?: (id: string) => void;
}

export function HabitItem({
  id,
  name,
  iconName,
  xp,
  completedToday,
  lifeArea,
  streak = 0,
  habitType = 'check',
  unit,
  dailyGoal,
  todayValue,
  onComplete,
  onUncomplete,
  onLog,
  onRelapse,
  onOpenAnalytics,
}: HabitItemProps) {
  const { t } = useLocale();
  const { lifeAreas } = useLifeAreas();
  const [isLoading, setIsLoading] = useState(false);
  const [burst, setBurst] = useState<{ xp: number; hint?: string } | null>(null);

  const isQuit = habitType === 'quit';
  const isMeasurable = habitType === 'measurable';

  const handleComplete = async () => {
    if (isLoading || completedToday) return;
    if (isMeasurable && onLog) {
      onLog(id);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      setIsLoading(true);
      const result = await onComplete(id);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const awarded = result && 'xpEarned' in result ? result.xpEarned : xp;
      const bonusPercent =
        result && result.streakMultiplier && result.streakMultiplier > 1
          ? Math.round((result.streakMultiplier - 1) * 100)
          : 0;
      setBurst({
        xp: awarded,
        hint: bonusPercent > 0 ? `+${bonusPercent}%` : undefined,
      });
    } catch (error) {
      console.error('Error completing habit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUncomplete = async () => {
    if (isLoading || !completedToday) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      setIsLoading(true);
      await onUncomplete(id);
    } catch (error) {
      console.error('Error uncompleting habit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const IconComponent = iconMap[iconName] || iconMap['Target'];

  const lifeAreaInfo = lifeAreas.find((area) => area.id === lifeArea);
  const lifeAreaName = lifeAreaInfo
    ? t(`lifeAreas.${String(lifeAreaInfo.area).toLowerCase()}`)
    : '';

  // Progress for measurable habits
  const progressPct =
    isMeasurable && dailyGoal && dailyGoal > 0
      ? Math.min(100, Math.round(((todayValue || 0) / dailyGoal) * 100))
      : completedToday
      ? 100
      : 0;

  const accentIconColor = isQuit ? CYAN_300 : TEAL_300;

  return (
    <View
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-[hsl(var(--glass-bg)/0.65)] p-3',
        completedToday
          ? isQuit
            ? 'border-cyan-400/50'
            : 'border-teal-400/50'
          : 'border-white/10'
      )}
      accessibilityLabel={t('habits.habitAria', { name })}
    >
      {/* XP burst celebration (one-shot) */}
      {burst && (
        <XPBurst xp={burst.xp} hint={burst.hint} onDone={() => setBurst(null)} />
      )}

      {/* Glowing left accent bar (brighter on completion) */}
      <View
        pointerEvents="none"
        className={cn(
          'absolute left-0 top-1/2 w-1 rounded-r-full',
          completedToday
            ? isQuit
              ? 'h-12 -mt-6 bg-cyan-400'
              : 'h-12 -mt-6 bg-teal-400'
            : 'h-8 -mt-4 bg-white/10'
        )}
      />

      <View className="relative z-10 flex-row items-center gap-3 pl-1">
        {/* Icon — accent tile */}
        <View
          className={cn(
            'h-12 w-12 items-center justify-center rounded-2xl border',
            completedToday
              ? isQuit
                ? 'border-white/25 bg-cyan-500'
                : 'border-white/25 bg-teal-500'
              : 'border-white/10 bg-white/10'
          )}
        >
          <IconComponent size={22} color={completedToday ? WHITE : accentIconColor} />
        </View>

        {/* Details (tap to open analytics) */}
        <Pressable
          onPress={() => onOpenAnalytics?.(id)}
          disabled={!onOpenAnalytics}
          className="min-w-0 flex-1 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel={t('habits.viewAnalytics')}
        >
          <View className="flex-row items-center gap-2">
            <Text
              numberOfLines={1}
              className="shrink text-[15px] font-bold tracking-tight text-white"
            >
              {name}
            </Text>
            {streak > 0 && (
              <View className="flex-row items-center gap-0.5">
                <Flame size={13} color={GOLD_300} fill="rgba(246,173,55,0.4)" />
                <Text className="text-xs font-extrabold text-gold-300">{streak}</Text>
              </View>
            )}
          </View>

          <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
            {/* Refined gold XP chip */}
            <View className="flex-row items-center gap-0.5 rounded-lg border border-gold-400/30 bg-gold-500/20 px-1.5 py-0.5">
              <Zap size={10} color={GOLD_300} fill={GOLD_300} />
              <Text className="text-[11px] font-extrabold text-gold-200">{xp}</Text>
            </View>
            {isQuit && (
              <View className="flex-row items-center gap-1 rounded-md border border-cyan-400/20 bg-cyan-500/20 px-1.5 py-0.5">
                <Shield size={11} color={CYAN_300} />
                <Text className="text-[11px] font-semibold text-cyan-200">
                  {t('habits.quitBadge')}
                </Text>
              </View>
            )}
            {isMeasurable && (
              <View className="rounded-md border border-teal-400/20 bg-teal-500/20 px-1.5 py-0.5">
                <Text className="text-[11px] font-semibold text-teal-200">
                  {todayValue ? `${todayValue}` : '0'}
                  {dailyGoal ? `/${dailyGoal}` : ''} {unit ? t(`habits.units.${unit}`, unit) : ''}
                </Text>
              </View>
            )}
            {!isQuit && !isMeasurable && lifeAreaName ? (
              <View className="rounded-md border border-white/5 bg-white/10 px-1.5 py-0.5">
                <Text className="text-[11px] font-semibold text-white/80">{lifeAreaName}</Text>
              </View>
            ) : null}
          </View>

          {/* Measurable progress bar */}
          {isMeasurable && dailyGoal ? (
            <View className="mt-2 h-1.5 overflow-hidden rounded-full border border-white/5 bg-white/10">
              <View
                className="h-full rounded-full bg-teal-400"
                style={{ width: `${progressPct}%` }}
              />
            </View>
          ) : null}
        </Pressable>

        {/* Actions */}
        <View className="flex-row gap-1.5">
          {isQuit ? (
            <>
              {/* Resisted */}
              <Pressable
                onPress={handleComplete}
                disabled={isLoading || completedToday}
                className={cn(
                  'h-12 w-12 items-center justify-center rounded-2xl border active:scale-95',
                  completedToday
                    ? 'border-white/25 bg-cyan-500'
                    : 'border-white/10 bg-white/5 active:bg-cyan-500/20'
                )}
                accessibilityRole="button"
                accessibilityLabel={t('habits.resisted')}
              >
                {isLoading && !completedToday ? (
                  <ActivityIndicator size="small" color={CYAN_300} />
                ) : (
                  <Shield size={20} color={completedToday ? WHITE : CYAN_300} />
                )}
              </Pressable>
              {/* Relapse */}
              <Pressable
                onPress={() => onRelapse?.(id)}
                disabled={isLoading}
                className={cn(
                  'h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 active:bg-danger-500/20',
                  isLoading && 'opacity-50'
                )}
                accessibilityRole="button"
                accessibilityLabel={t('habits.relapse')}
              >
                <X size={20} color={WHITE_50} />
              </Pressable>
            </>
          ) : (
            <>
              {/* Complete / Log */}
              <Pressable
                onPress={handleComplete}
                disabled={isLoading || completedToday}
                className={cn(
                  'h-12 w-12 items-center justify-center rounded-2xl border active:scale-95',
                  completedToday
                    ? 'border-white/25 bg-teal-500'
                    : 'border-white/10 bg-white/5 active:bg-teal-500/20'
                )}
                accessibilityRole="button"
                accessibilityLabel={
                  isMeasurable ? t('habits.logValue') : t('habits.markComplete', { name })
                }
                accessibilityState={{ selected: completedToday }}
              >
                {isLoading && !completedToday ? (
                  <ActivityIndicator size="small" color={TEAL_300} />
                ) : isMeasurable && !completedToday ? (
                  <Timer size={20} color={TEAL_300} />
                ) : (
                  <Check
                    size={20}
                    strokeWidth={completedToday ? 3 : 2}
                    color={completedToday ? WHITE : TEAL_300}
                  />
                )}
                {completedToday && (
                  <View className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-gold-400" />
                )}
              </Pressable>
              {/* Uncomplete */}
              <Pressable
                onPress={handleUncomplete}
                disabled={isLoading || !completedToday}
                className={cn(
                  'h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 active:bg-danger-500/20',
                  (isLoading || !completedToday) && 'opacity-40'
                )}
                accessibilityRole="button"
                accessibilityLabel={t('habits.markIncomplete', { name })}
                accessibilityState={{ selected: !completedToday }}
              >
                {isLoading && completedToday ? (
                  <ActivityIndicator size="small" color={WHITE_50} />
                ) : (
                  <X size={20} strokeWidth={2} color={WHITE_50} />
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

export default HabitItem;
