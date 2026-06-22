/**
 * HabitAnalytics — per-habit analytics modal (recreates HabitTick "Analíticas").
 * Shows current streak, best streak, total completed, a trend sparkline and heatmap.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { X, Flame, Trophy, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react';
import { useHabits } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import type { HabitDayLog } from '@/types';
import { HabitHeatmap } from './HabitHeatmap';

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
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsla(167,78%,48%,0.35)" />
          <stop offset="100%" stopColor="hsla(167,78%,48%,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trendFill)" />
      <path d={path} fill="none" stroke="hsl(167,80%,50%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-charcoal-500 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-soft-xl max-h-[92vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-charcoal-500/95 backdrop-blur-md px-5 py-4 flex items-center gap-3 border-b border-white/10 z-10">
          <TrendingUp className="w-5 h-5 text-teal-400" />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate flex items-center gap-2">
              {iconEmoji} {habitName}
            </h3>
            <p className="text-xs text-white/50">{t('analytics.title')}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl grid place-items-center bg-white/10 text-white/70 hover:bg-white/15"
            aria-label={t('actions.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!history ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="w-7 h-7 text-teal-400 animate-spin" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl p-3 text-center bg-gradient-to-br from-orange-500/15 to-transparent border border-orange-400/20">
                <Flame className="w-5 h-5 mx-auto text-orange-400 mb-1" />
                <div className="text-2xl font-bold text-white">{stats?.current ?? 0}</div>
                <div className="text-[11px] text-white/55">{t('analytics.currentStreak')}</div>
              </div>
              <div className="rounded-2xl p-3 text-center bg-gradient-to-br from-gold-500/15 to-transparent border border-gold-400/20">
                <Trophy className="w-5 h-5 mx-auto text-gold-400 mb-1" />
                <div className="text-2xl font-bold text-white">{stats?.best ?? 0}</div>
                <div className="text-[11px] text-white/55">{t('analytics.bestStreak')}</div>
              </div>
              <div className="rounded-2xl p-3 text-center bg-gradient-to-br from-teal-500/15 to-transparent border border-teal-400/20">
                <CheckCircle2 className="w-5 h-5 mx-auto text-teal-400 mb-1" />
                <div className="text-2xl font-bold text-white">{stats?.totalCompleted ?? 0}</div>
                <div className="text-[11px] text-white/55">{t('analytics.completed')}</div>
              </div>
            </div>

            {habitType === 'measurable' && (stats?.totalValue ?? 0) > 0 && (
              <div className="rounded-2xl p-3 bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <span className="text-sm text-white/60">{t('analytics.totalValue')}</span>
                <span className="text-lg font-bold text-teal-300">
                  {Math.round((stats?.totalValue ?? 0) * 100) / 100} {unit}
                </span>
              </div>
            )}

            {!hasData ? (
              <p className="text-center text-sm text-white/50 py-8">{t('analytics.noData')}</p>
            ) : (
              <>
                {/* Trend */}
                <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-teal-400" /> {t('analytics.trend')}
                    </span>
                    <div className="flex gap-1">
                      {([30, 90, 365] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRange(r)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            range === r ? 'bg-teal-500 text-white' : 'bg-white/10 text-white/60'
                          }`}
                        >
                          {r === 365 ? t('analytics.year') : `${r}d`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Sparkline history={history} days={range} />
                </div>

                {/* Heatmap */}
                <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10">
                  <span className="text-sm font-bold text-white mb-3 block">{t('analytics.history')}</span>
                  <HabitHeatmap history={history} accent={accent as 'teal' | 'cyan'} weeks={26} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HabitAnalytics;
