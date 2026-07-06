/**
 * Mood — Daylio-inspired daily mood journal (React Native port of
 * ../src/pages/Mood.tsx).
 * Today selector + month calendar + stats + distribution. Storage-backed
 * (MoodService over the kv mirror). Stack screen: normal bottom padding.
 * Calendar cells are fixed-size in a flex-row flex-wrap (no CSS grid).
 */

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Smile,
  Flame,
  CalendarDays,
  Check,
} from 'lucide-react-native';
import toast from '@/lib/toast';
import { useLocale } from '@/hooks/useLocale';
import { MoodService, localDateKey } from '@/services/mood.service';
import { MOODS, moodByLevel, type MoodLevel, type MoodEntry } from '@/types/mood';
import { Header } from '@/components/layout';
import { GlassCard } from '@/components/ui';
import { cn } from '@/utils/cn';

/**
 * The web tints with `${color}1f` / `${color}33` (hex alpha appended to an
 * hsl() string — silently invalid). Native color parsing is strict, so we
 * build a proper hsla() with the intended alpha instead.
 */
function hslWithAlpha(color: string, alpha: number): string {
  return color.replace('hsl(', 'hsla(').replace(/\)\s*$/, `, ${alpha})`);
}

const GOLD_400 = 'hsl(40, 95%, 58%)';
const ORANGE_400 = 'hsl(36, 100%, 60%)';

export function Mood() {
  const { t, language } = useLocale();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [entries, setEntries] = useState<MoodEntry[]>(() => MoodService.getAll());
  const todayKey = localDateKey();
  const todayEntry = entries.find((e) => e.date === todayKey);

  const [selected, setSelected] = useState<MoodLevel | null>(
    todayEntry ? todayEntry.mood : null
  );
  const [note, setNote] = useState(todayEntry?.note || '');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const entryMap = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries]);
  const streak = useMemo(() => MoodService.getStreak(), [entries]);
  const average = useMemo(() => MoodService.getAverage(entries), [entries]);

  const handleSave = () => {
    if (selected === null) return;
    const updated = MoodService.upsert(todayKey, selected, note.trim() || undefined);
    setEntries(updated);
    toast.success(t('mood.saved'));
  };

  // distribution (all-time)
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    entries.forEach((e) => (counts[e.mood] += 1));
    const max = Math.max(...counts, 1);
    return MOODS.map((m) => ({ ...m, count: counts[m.level], pct: (counts[m.level] / max) * 100 }));
  }, [entries]);

  // calendar grid for current month
  const calendar = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(year, m, 1);
    const startOffset = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const cells: ({ day: number; key: string; entry?: MoodEntry } | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, key, entry: entryMap.get(key) });
    }
    return cells;
  }, [month, entryMap]);

  const rawWeekdays = t('mood.weekdaysNarrow', { returnObjects: true }) as unknown as string[];
  const weekdays =
    Array.isArray(rawWeekdays) && rawWeekdays.length === 7
      ? rawWeekdays
      : ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const monthLabel = month.toLocaleDateString(language, { month: 'long', year: 'numeric' });
  const avgMood = average !== null ? moodByLevel(Math.round(average) as MoodLevel) : null;

  // Fixed-size calendar cells: screen px-3 (24) + card p-4 (32) + 6 gaps of 6px
  const contentW = Math.min(width, 448);
  const cellGap = 6;
  const cellSize = Math.floor((contentW - 24 - 32 - cellGap * 6) / 7);

  return (
    <View className="flex-1 bg-background">
      <Header />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}>
          {/* Header */}
          <View className="mb-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Smile size={28} color={GOLD_400} />
                  <Text className="text-3xl font-extrabold tracking-tight text-white">
                    {t('mood.title')}
                  </Text>
                </View>
                <Text className="mt-1 text-sm text-white/60">{t('mood.subtitle')}</Text>
              </View>
              {streak > 0 && (
                <View className="flex-row items-center gap-1.5 rounded-2xl border border-orange-400/25 bg-orange-500/15 px-3 py-2">
                  <Flame size={16} color={ORANGE_400} />
                  <Text className="font-bold text-white">{streak}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Today's mood selector */}
          <GlassCard className="mb-5 p-5">
            <Text className="mb-4 text-center text-base font-bold text-white">
              {t('mood.howAreYou')}
            </Text>
            <View className="mb-4 flex-row justify-between gap-1.5">
              {MOODS.map((m) => {
                const active = selected === m.level;
                return (
                  <Pressable
                    key={m.level}
                    onPress={() => setSelected(m.level)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={t(`mood.${m.labelKey}`)}
                    className={cn(
                      'flex-1 items-center gap-1.5 rounded-2xl border-2 py-3',
                      active ? '' : 'border-transparent opacity-60'
                    )}
                    style={
                      active
                        ? {
                            borderColor: m.color,
                            backgroundColor: hslWithAlpha(m.color, 0.12),
                          }
                        : undefined
                    }
                  >
                    <Text className="text-3xl">{m.emoji}</Text>
                    <Text className="text-[10px] font-semibold text-white/80">
                      {t(`mood.${m.labelKey}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('mood.notePlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              numberOfLines={2}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white"
              style={{ minHeight: 64, textAlignVertical: 'top' }}
            />

            <Pressable
              onPress={handleSave}
              disabled={selected === null}
              accessibilityRole="button"
              accessibilityState={{ disabled: selected === null }}
              className={cn(
                'mt-3 w-full flex-row items-center justify-center gap-2 rounded-[14px] bg-primary px-6 py-3 active:scale-95',
                selected === null && 'opacity-40'
              )}
            >
              <Check size={20} color="#FFFFFF" />
              <Text className="text-base font-bold text-primary-foreground">
                {todayEntry ? t('mood.edit') : t('mood.save')}
              </Text>
            </Pressable>
          </GlassCard>

          {/* Stats */}
          <View className="mb-5 flex-row gap-3">
            <GlassCard className="flex-1 items-center p-3">
              <CalendarDays size={20} color="#2DD4BF" />
              <Text className="mt-1 text-2xl font-bold text-white">{entries.length}</Text>
              <Text className="text-[11px] text-white/55">{t('mood.entries')}</Text>
            </GlassCard>
            <GlassCard className="flex-1 items-center p-3">
              <View className="h-7 items-center justify-center">
                <Text className="text-2xl">{avgMood ? avgMood.emoji : '—'}</Text>
              </View>
              <Text className="mt-1 text-[11px] text-white/55">{t('mood.averageMood')}</Text>
            </GlassCard>
            <GlassCard className="flex-1 items-center p-3">
              <Flame size={20} color={ORANGE_400} />
              <Text className="mt-1 text-2xl font-bold text-white">{streak}</Text>
              <Text className="text-[11px] text-white/55">{t('mood.moodStreak')}</Text>
            </GlassCard>
          </View>

          {/* Calendar */}
          <GlassCard className="mb-5 p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Pressable
                onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                accessibilityRole="button"
                accessibilityLabel={t('mood.prevMonth')}
                className="h-8 w-8 items-center justify-center rounded-lg bg-white/5 active:bg-white/10"
              >
                <ChevronLeft size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
              <Text className="font-bold capitalize text-white">{monthLabel}</Text>
              <Pressable
                onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                accessibilityRole="button"
                accessibilityLabel={t('mood.nextMonth')}
                className="h-8 w-8 items-center justify-center rounded-lg bg-white/5 active:bg-white/10"
              >
                <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
            <View className="mb-1.5 flex-row flex-wrap" style={{ gap: cellGap }}>
              {weekdays.map((d, i) => (
                <View key={i} style={{ width: cellSize }} className="items-center">
                  <Text className="text-[10px] font-semibold text-white/40">{d}</Text>
                </View>
              ))}
            </View>
            <View className="flex-row flex-wrap" style={{ gap: cellGap }}>
              {calendar.map((cell, i) =>
                cell === null ? (
                  <View key={`e${i}`} style={{ width: cellSize, height: cellSize }} />
                ) : (
                  <View
                    key={cell.key}
                    accessibilityLabel={cell.key}
                    className={cn(
                      'items-center justify-center rounded-xl',
                      cell.key === todayKey && 'border-2 border-gold-400/60'
                    )}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: cell.entry
                        ? hslWithAlpha(moodByLevel(cell.entry.mood).color, 0.2)
                        : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    {cell.entry ? (
                      <Text className="text-base leading-none">
                        {moodByLevel(cell.entry.mood).emoji}
                      </Text>
                    ) : (
                      <Text className="text-xs text-white/30">{cell.day}</Text>
                    )}
                  </View>
                )
              )}
            </View>
          </GlassCard>

          {/* Distribution */}
          {entries.length > 0 ? (
            <GlassCard className="p-4">
              <Text className="mb-3 text-sm font-bold text-white">{t('mood.distribution')}</Text>
              <View className="gap-2">
                {distribution.map((m) => (
                  <View key={m.level} className="flex-row items-center gap-2">
                    <Text className="w-6 text-center text-lg">{m.emoji}</Text>
                    <View className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${m.pct}%`, backgroundColor: m.color }}
                      />
                    </View>
                    <Text className="w-6 text-right text-xs text-white/60">{m.count}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          ) : (
            <Text className="py-6 text-center text-sm text-white/40">{t('mood.noEntries')}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default Mood;
