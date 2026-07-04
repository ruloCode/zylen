/**
 * MeasureLogger — log a value for a measurable habit.
 * Recreates HabitTick's "Registrar tiempo" sheet:
 *   - Manual: type a number (or pick a time range / duration for time units)
 *   - Stopwatch: count up, then save elapsed
 *   - Countdown: pick a duration, count down, save elapsed
 *
 * For non-time units (km, reps, pages…) only Manual entry is shown.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Pencil, Timer, Hourglass, Play, Pause, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';

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
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-charcoal-500 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-soft-xl p-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl grid place-items-center bg-teal-500/20 text-teal-300">
            <Timer className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {isTime ? t('timer.logTime') : t('timer.logValue')}
            </h3>
            <p className="text-sm text-white/60 truncate">{habitName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl grid place-items-center bg-white/10 text-white/70 hover:bg-white/15"
            aria-label={t('actions.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode tabs */}
        {modes.length > 1 && (
          <div className="flex gap-1 p-1 rounded-2xl bg-white/5 mb-5">
            {modes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setMode(id);
                  setRunning(false);
                  setElapsed(0);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  mode === id ? 'bg-teal-500 text-white shadow-glow-teal' : 'text-white/60 hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        )}

        {/* Manual */}
        {mode === 'manual' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-teal-500/10 border border-teal-400/25 p-5 text-center">
              <input
                type="number"
                autoFocus
                min={0}
                inputMode="decimal"
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-center text-5xl font-bold text-teal-300 focus:outline-none placeholder:text-teal-300/30"
              />
              <span className="text-teal-300/80 font-semibold">{t(`habits.units.${unit}`, unit)}</span>
            </div>
          </div>
        )}

        {/* Stopwatch / Countdown */}
        {(mode === 'stopwatch' || mode === 'countdown') && (
          <div className="space-y-4">
            {mode === 'countdown' && (
              <div className="grid grid-cols-4 gap-2">
                {COUNTDOWN_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setTarget(p.secs);
                      setElapsed(0);
                      setRunning(false);
                    }}
                    className={cn(
                      'py-2 rounded-xl text-sm font-bold border transition-all',
                      target === p.secs
                        ? 'bg-teal-500 border-teal-400 text-white'
                        : 'bg-white/5 border-white/10 text-teal-300 hover:border-white/25'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <div className="relative grid place-items-center py-8">
              <div className="w-44 h-44 rounded-full border-4 border-teal-500/30 grid place-items-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white tabular-nums">{fmt(display)}</div>
                  <div className="text-xs font-bold tracking-widest text-teal-400 mt-1">
                    {running ? t('timer.running') : t('timer.paused')}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRunning((r) => !r)}
                className="flex-1 btn-primary"
              >
                {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {running ? t('timer.pause') : mode === 'countdown' ? t('timer.startCountdown') : t('timer.startTimer')}
              </button>
              <button
                onClick={() => {
                  setRunning(false);
                  setElapsed(0);
                }}
                className="w-12 rounded-xl grid place-items-center bg-white/10 text-white/70 hover:bg-white/15"
                aria-label={t('timer.reset')}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || resolvedValue <= 0}
          className="btn-primary w-full mt-5 disabled:opacity-40"
        >
          <Check className="w-5 h-5" />
          {t('timer.save')}
          {resolvedValue > 0 && (
            <span className="opacity-80">
              · {resolvedValue} {t(`habits.units.${unit}`, unit)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default MeasureLogger;
