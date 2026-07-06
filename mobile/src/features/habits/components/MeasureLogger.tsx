/**
 * MeasureLogger — log a value for a measurable habit. (React Native port)
 * Recreates HabitTick's "Registrar tiempo" sheet:
 *   - Manual: type a number (or pick a time range / duration for time units)
 *   - Stopwatch: count up, then save elapsed
 *   - Countdown: pick a duration, count down, save elapsed
 *
 * For non-time units (km, reps, pages…) only Manual entry is shown.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { X, Pencil, Timer, Hourglass, Play, Pause, RotateCcw, Check } from 'lucide-react-native';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';
import { SheetShell } from './SheetShell';

const TEAL_300 = '#5EEAD4';
const WHITE = '#FFFFFF';
const WHITE_70 = 'rgba(255,255,255,0.7)';

interface MeasureLoggerProps {
  habitName: string;
  unit: string;
  dailyGoal?: number;
  onSave: (value: number) => Promise<void> | void;
  onClose: () => void;
}

type Mode = 'manual' | 'stopwatch' | 'countdown';

const TIME_UNITS = ['min', 'hr', 'sec'];
const COUNTDOWN_PRESETS = [
  { label: '30s', secs: 30 },
  { label: '5m', secs: 300 },
  { label: '15m', secs: 900 },
  { label: '30m', secs: 1800 },
];

function fmt(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function MeasureLogger({ habitName, unit, dailyGoal, onSave, onClose }: MeasureLoggerProps) {
  const { t } = useLocale();
  const isTime = TIME_UNITS.includes(unit);
  const [mode, setMode] = useState<Mode>('manual');
  const [manualValue, setManualValue] = useState<string>(dailyGoal ? String(dailyGoal) : '');
  const [saving, setSaving] = useState(false);

  // Timer state (seconds)
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [target, setTarget] = useState(900); // countdown target
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          if (mode === 'countdown' && e + 1 >= target) {
            setRunning(false);
            return target;
          }
          return e + 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode, target]);

  // Convert measured seconds into the habit's time unit
  const secondsToUnit = (secs: number) => {
    if (unit === 'sec') return secs;
    if (unit === 'hr') return Math.round((secs / 3600) * 100) / 100;
    return Math.round((secs / 60) * 100) / 100; // min
  };

  const display = mode === 'countdown' ? Math.max(0, target - elapsed) : elapsed;

  const resolvedValue = useMemo(() => {
    if (mode === 'manual') return Number(manualValue) || 0;
    return secondsToUnit(elapsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, manualValue, elapsed, unit]);

  const handleSave = async () => {
    if (resolvedValue <= 0) return;
    try {
      setSaving(true);
      await onSave(resolvedValue);
    } finally {
      setSaving(false);
    }
  };

  const modes: { id: Mode; label: string; icon: typeof Pencil }[] = isTime
    ? [
        { id: 'manual', label: t('timer.manual'), icon: Pencil },
        { id: 'stopwatch', label: t('timer.stopwatch'), icon: Timer },
        { id: 'countdown', label: t('timer.countdown'), icon: Hourglass },
      ]
    : [{ id: 'manual', label: t('timer.manual'), icon: Pencil }];

  return (
    <SheetShell onClose={onClose}>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="mb-5 flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/20">
            <Timer size={20} color={TEAL_300} />
          </View>
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="text-lg font-bold text-white">
              {isTime ? t('timer.logTime') : t('timer.logValue')}
            </Text>
            <Text numberOfLines={1} className="text-sm text-white/60">
              {habitName}
            </Text>
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

        {/* Mode tabs */}
        {modes.length > 1 && (
          <View className="mb-5 flex-row gap-1 rounded-2xl bg-white/5 p-1">
            {modes.map(({ id, label, icon: Icon }) => (
              <Pressable
                key={id}
                onPress={() => {
                  setMode(id);
                  setRunning(false);
                  setElapsed(0);
                }}
                className={cn(
                  'flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5',
                  mode === id ? 'bg-teal-500' : ''
                )}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === id }}
              >
                <Icon size={16} color={mode === id ? WHITE : WHITE_70} />
                <Text
                  className={cn(
                    'text-sm font-semibold',
                    mode === id ? 'text-white' : 'text-white/60'
                  )}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Manual */}
        {mode === 'manual' && (
          <View className="gap-4">
            <View className="items-center rounded-2xl border border-teal-400/25 bg-teal-500/10 p-5">
              <TextInput
                autoFocus
                keyboardType="decimal-pad"
                value={manualValue}
                onChangeText={setManualValue}
                placeholder="0"
                placeholderTextColor="rgba(94,234,212,0.3)"
                className="w-full text-center text-5xl font-bold text-teal-300"
              />
              <Text className="font-semibold text-teal-300/80">
                {t(`habits.units.${unit}`, unit)}
              </Text>
            </View>
          </View>
        )}

        {/* Stopwatch / Countdown */}
        {(mode === 'stopwatch' || mode === 'countdown') && (
          <View className="gap-4">
            {mode === 'countdown' && (
              <View className="flex-row gap-2">
                {COUNTDOWN_PRESETS.map((p) => (
                  <Pressable
                    key={p.label}
                    onPress={() => {
                      setTarget(p.secs);
                      setElapsed(0);
                      setRunning(false);
                    }}
                    className={cn(
                      'flex-1 items-center rounded-xl border py-2',
                      target === p.secs
                        ? 'border-teal-400 bg-teal-500'
                        : 'border-white/10 bg-white/5'
                    )}
                    accessibilityRole="button"
                    accessibilityState={{ selected: target === p.secs }}
                  >
                    <Text
                      className={cn(
                        'text-sm font-bold',
                        target === p.secs ? 'text-white' : 'text-teal-300'
                      )}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View className="items-center py-8">
              <View className="h-44 w-44 items-center justify-center rounded-full border-4 border-teal-500/30">
                <View className="items-center">
                  <Text
                    className="text-4xl font-bold text-white"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {fmt(display)}
                  </Text>
                  <Text className="mt-1 text-xs font-bold tracking-widest text-teal-400">
                    {running ? t('timer.running') : t('timer.paused')}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setRunning((r) => !r)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 active:bg-teal-600"
                accessibilityRole="button"
              >
                {running ? <Pause size={20} color={WHITE} /> : <Play size={20} color={WHITE} />}
                <Text className="font-semibold text-white">
                  {running
                    ? t('timer.pause')
                    : mode === 'countdown'
                    ? t('timer.startCountdown')
                    : t('timer.startTimer')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setRunning(false);
                  setElapsed(0);
                }}
                className="w-12 items-center justify-center rounded-xl bg-white/10 active:bg-white/15"
                accessibilityRole="button"
                accessibilityLabel={t('timer.reset')}
              >
                <RotateCcw size={20} color={WHITE_70} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Save */}
        <Pressable
          onPress={handleSave}
          disabled={saving || resolvedValue <= 0}
          className={cn(
            'mt-5 w-full flex-row items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 active:bg-teal-600',
            (saving || resolvedValue <= 0) && 'opacity-40'
          )}
          accessibilityRole="button"
        >
          <Check size={20} color={WHITE} />
          <Text className="font-semibold text-white">
            {t('timer.save')}
            {resolvedValue > 0 ? ` · ${resolvedValue} ${t(`habits.units.${unit}`, unit)}` : ''}
          </Text>
        </Pressable>
      </ScrollView>
    </SheetShell>
  );
}

export default MeasureLogger;
