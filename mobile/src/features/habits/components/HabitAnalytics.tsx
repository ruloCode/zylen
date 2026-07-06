/**
 * HabitAnalytics — per-habit analytics bottom sheet (recreates HabitTick "Analíticas").
 * Shows current streak, best streak, total completed, a trend sparkline and heatmap.
 * React Native port: sparkline rendered with react-native-svg.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { X, Flame, Trophy, CheckCircle2, TrendingUp } from 'lucide-react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import { useHabits } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import type { HabitDayLog } from '@/types';
import { HabitHeatmap } from './HabitHeatmap';
import { SheetShell } from './SheetShell';
import { cn } from '@/utils/cn';

const TEAL_400 = '#2DD4BF';
const ORANGE_400 = '#FB923C';
const GOLD_400 = '#F6AD37';
const WHITE_70 = 'rgba(255,255,255,0.7)';

interface HabitAnalyticsProps {
  habitId: string;
  habitName: string;
  iconEmoji?: React.ReactNode;
  habitType?: 'check' | 'measurable' | 'quit';
  unit?: string;
  onClose: () => void;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeStats(history: HabitDayLog[]) {
  const set = new Set(history.filter((h) => h.count > 0).map((h) => h.date));
  const totalCompleted = history.reduce((s, h) => s + h.count, 0);
  const totalValue = history.reduce((s, h) => s + (h.value || 0), 0);

  // current streak (today or yesterday backwards)
  let current = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!set.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1); // allow streak if logged yesterday
  while (set.has(dateKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // best streak across all history
  const sorted = Array.from(set).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of sorted) {
    const [y, m, d] = key.split('-').map(Number);
    const cur = new Date(y, m - 1, d);
    if (prev) {
      const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = cur;
  }

  return { current, best, totalCompleted, totalValue };
}

function Sparkline({ history, days }: { history: HabitDayLog[]; days: number }) {
  const gradientId = React.useId();

  const points = useMemo(() => {
    const map = new Map(history.map((h) => [h.date, h]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const vals: number[] = [];
    let cumulative = 0;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const e = map.get(dateKey(d));
      cumulative += e ? e.value || e.count : 0;
      vals.push(cumulative);
    }
    return vals;
  }, [history, days]);

  const max = Math.max(...points, 1);
  const w = 300;
  const h = 90;
  const step = w / Math.max(points.length - 1, 1);
  const path = points
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(h - (v / max) * h).toFixed(1)}`)
    .join(' ');
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <Svg width="100%" height={96} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="hsl(167,78%,48%)" stopOpacity={0.35} />
          <Stop offset="100%" stopColor="hsl(167,78%,48%)" stopOpacity={0} />
        </SvgLinearGradient>
      </Defs>
      <Path d={area} fill={`url(#${gradientId})`} />
      <Path
        d={path}
        fill="none"
        stroke="hsl(167,80%,50%)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HabitAnalytics({ habitId, habitName, iconEmoji, habitType = 'check', unit, onClose }: HabitAnalyticsProps) {
  const { t } = useLocale();
  const { getHabitHistory } = useHabits();
  const [history, setHistory] = useState<HabitDayLog[] | null>(null);
  const [range, setRange] = useState<30 | 90 | 365>(30);

  useEffect(() => {
    let active = true;
    getHabitHistory(habitId, 365).then((h) => {
      if (active) setHistory(h);
    });
    return () => {
      active = false;
    };
  }, [habitId, getHabitHistory]);

  const stats = useMemo(() => (history ? computeStats(history) : null), [history]);
  const accent = habitType === 'quit' ? 'cyan' : 'teal';
  const hasData = history && history.length > 0;

  return (
    <SheetShell onClose={onClose} accessibilityLabel={t('analytics.title')}>
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-white/10 px-5 py-4">
        <TrendingUp size={20} color={TEAL_400} />
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-lg font-bold text-white">
            {iconEmoji} {habitName}
          </Text>
          <Text className="text-xs text-white/50">{t('analytics.title')}</Text>
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

      {!history ? (
        <View className="items-center justify-center py-20">
          <ActivityIndicator size="small" color={TEAL_400} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          {/* Stat cards */}
          <View className="flex-row gap-3">
            <View className="flex-1 items-center rounded-2xl border border-orange-400/20 bg-orange-500/10 p-3">
              <Flame size={20} color={ORANGE_400} />
              <Text className="mt-1 text-2xl font-bold text-white">{stats?.current ?? 0}</Text>
              <Text className="text-center text-[11px] text-white/55">
                {t('analytics.currentStreak')}
              </Text>
            </View>
            <View className="flex-1 items-center rounded-2xl border border-gold-400/20 bg-gold-500/10 p-3">
              <Trophy size={20} color={GOLD_400} />
              <Text className="mt-1 text-2xl font-bold text-white">{stats?.best ?? 0}</Text>
              <Text className="text-center text-[11px] text-white/55">
                {t('analytics.bestStreak')}
              </Text>
            </View>
            <View className="flex-1 items-center rounded-2xl border border-teal-400/20 bg-teal-500/10 p-3">
              <CheckCircle2 size={20} color={TEAL_400} />
              <Text className="mt-1 text-2xl font-bold text-white">
                {stats?.totalCompleted ?? 0}
              </Text>
              <Text className="text-center text-[11px] text-white/55">
                {t('analytics.completed')}
              </Text>
            </View>
          </View>

          {habitType === 'measurable' && (stats?.totalValue ?? 0) > 0 && (
            <View className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
              <Text className="text-sm text-white/60">{t('analytics.totalValue')}</Text>
              <Text className="text-lg font-bold text-teal-300">
                {Math.round((stats?.totalValue ?? 0) * 100) / 100}{' '}
                {unit ? t(`habits.units.${unit}`, unit) : ''}
              </Text>
            </View>
          )}

          {!hasData ? (
            <Text className="py-8 text-center text-sm text-white/50">
              {t('analytics.noData')}
            </Text>
          ) : (
            <>
              {/* Trend */}
              <View className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <View className="mb-2 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <TrendingUp size={16} color={TEAL_400} />
                    <Text className="text-sm font-bold text-white">{t('analytics.trend')}</Text>
                  </View>
                  <View className="flex-row gap-1">
                    {([30, 90, 365] as const).map((r) => (
                      <Pressable
                        key={r}
                        onPress={() => setRange(r)}
                        className={cn(
                          'rounded-md px-2 py-0.5',
                          range === r ? 'bg-teal-500' : 'bg-white/10'
                        )}
                        accessibilityRole="button"
                        accessibilityState={{ selected: range === r }}
                      >
                        <Text
                          className={cn(
                            'text-[11px] font-semibold',
                            range === r ? 'text-white' : 'text-white/60'
                          )}
                        >
                          {r === 365 ? t('analytics.year') : `${r}d`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <Sparkline history={history} days={range} />
              </View>

              {/* Heatmap */}
              <View className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Text className="mb-3 text-sm font-bold text-white">
                  {t('analytics.history')}
                </Text>
                <HabitHeatmap history={history} accent={accent as 'teal' | 'cyan'} weeks={26} />
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SheetShell>
  );
}

export default HabitAnalytics;
