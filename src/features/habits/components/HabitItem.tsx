/**
 * Zylen v2 HabitItem — AAA mobile tile
 * Premium glass card: top-lit gradient, glossy accent icon with radial glow,
 * refined gold XP chip, streak flame, celebratory completion sheen, and
 * tactile press states. Supports check / measurable / quit habit types.
 */

import React, { useState } from 'react';
import { Check, X, Loader2, Flame, Shield, Timer, Zap } from 'lucide-react';
import { cn } from '@/utils';
import { XPBurst } from '@/components/effects/XPBurst';
import { HABIT_ICONS } from './IconSelector';
import { useLifeAreas } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import type { HabitType } from '@/types';
import type { HabitToggleResult } from '@/store/habitsSlice';

const iconMap = HABIT_ICONS;

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
    try {
      setIsLoading(true);
      const result = await onComplete(id);
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

  return (
    <article
      className={cn(
        'glass-card p-3 sm:p-3.5 transition-all duration-300 relative overflow-hidden group',
        'active:scale-[0.985]',
        completedToday
          ? isQuit
            ? 'border-cyan-400/50 shadow-glow-teal'
            : 'border-teal-400/50 shadow-glow-teal'
          : 'hover:-translate-y-0.5 hover:shadow-soft-lg'
      )}
      aria-label={t('habits.habitAria', { name })}
    >
      {/* XP burst celebration (one-shot) */}
      {burst && (
        <XPBurst xp={burst.xp} hint={burst.hint} onDone={() => setBurst(null)} />
      )}

      {/* Top-lit gloss (subtle AAA card sheen, always on) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/[0.05] to-transparent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      {/* Glowing left accent bar (brighter on completion) */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full transition-all duration-300',
          completedToday
            ? isQuit
              ? 'bg-gradient-to-b from-cyan-300 to-cyan-500 shadow-[0_0_10px_hsl(186_75%_57%/0.8)] h-12'
              : 'bg-gradient-to-b from-teal-300 to-teal-500 shadow-glow-teal h-12'
            : 'bg-white/10'
        )}
      />

      {/* Completion glow wash + diagonal sheen */}
      {completedToday && (
        <>
          <div
            className={cn(
              'absolute inset-x-0 -top-8 h-20 opacity-30 animate-glow-pulse pointer-events-none blur-2xl',
              isQuit ? 'bg-cyan-400/40' : 'bg-teal-400/40'
            )}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-transparent via-white/[0.06] to-transparent"
          />
        </>
      )}

      <div className="flex items-center gap-3 relative z-10 pl-1">
        {/* Icon — glossy tile with radial glow */}
        <div className="relative flex-shrink-0">
          {/* Soft radial glow behind the icon */}
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 rounded-2xl blur-md transition-opacity duration-300',
              completedToday
                ? isQuit
                  ? 'bg-cyan-400/50 opacity-70'
                  : 'bg-teal-400/50 opacity-70'
                : 'bg-teal-400/20 opacity-0 group-hover:opacity-100'
            )}
          />
          <div
            className={cn(
              'relative w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl grid place-items-center transition-all duration-300',
              'ring-1 ring-inset',
              completedToday
                ? isQuit
                  ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white ring-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]'
                  : 'bg-gradient-to-br from-teal-400 to-teal-600 text-white ring-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]'
                : 'bg-gradient-to-br from-white/[0.1] to-white/[0.02] text-teal-300 ring-white/10 group-hover:ring-teal-400/30'
            )}
          >
            <IconComponent size={22} />
          </div>
        </div>

        {/* Details (tap to open analytics) */}
        <button
          type="button"
          onClick={() => onOpenAnalytics?.(id)}
          disabled={!onOpenAnalytics}
          className="flex-1 min-w-0 text-left disabled:cursor-default"
          aria-label={t('habits.viewAnalytics')}
        >
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[15px] sm:text-base text-white truncate tracking-tight">
              {name}
            </h3>
            {streak > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs font-extrabold text-gold-300 flex-shrink-0 drop-shadow-[0_0_6px_hsl(40_95%_58%/0.5)]">
                <Flame size={13} className="fill-gold-400/40" />
                {streak}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {/* Refined gold XP chip (no constant pulse) */}
            <span className="inline-flex items-center gap-0.5 rounded-lg bg-gradient-to-br from-gold-400/25 to-gold-600/10 ring-1 ring-inset ring-gold-400/30 px-1.5 py-0.5 text-[11px] font-extrabold text-gold-200">
              <Zap size={10} className="fill-gold-300 text-gold-300" />
              {xp}
            </span>
            {isQuit && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-cyan-500/20 text-cyan-200 ring-1 ring-inset ring-cyan-400/20">
                <Shield size={11} /> {t('habits.quitBadge')}
              </span>
            )}
            {isMeasurable && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-teal-500/20 text-teal-200 ring-1 ring-inset ring-teal-400/20">
                {todayValue ? `${todayValue}` : '0'}
                {dailyGoal ? `/${dailyGoal}` : ''} {unit ? t(`habits.units.${unit}`, unit) : ''}
              </span>
            )}
            {!isQuit && !isMeasurable && lifeAreaName && (
              <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-white/10 text-white/80 ring-1 ring-inset ring-white/5">
                {lifeAreaName}
              </span>
            )}
          </div>

          {/* Measurable progress bar */}
          {isMeasurable && dailyGoal ? (
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden ring-1 ring-inset ring-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 shadow-[0_0_8px_hsl(172_66%_50%/0.6)] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          ) : null}
        </button>

        {/* Actions */}
        <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
          {isQuit ? (
            <>
              {/* Resisted */}
              <button
                type="button"
                onClick={handleComplete}
                disabled={isLoading || completedToday}
                className={cn(
                  'w-12 h-12 rounded-2xl grid place-items-center transition-all duration-300',
                  'ring-1 ring-inset active:scale-95',
                  'focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/40',
                  'disabled:cursor-not-allowed',
                  completedToday
                    ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white ring-white/25 shadow-glow-teal shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] scale-105'
                    : 'bg-white/[0.06] text-cyan-300 ring-white/10 hover:bg-cyan-500/20 hover:ring-cyan-400/40 hover:scale-105'
                )}
                aria-label={t('habits.resisted')}
                title={t('habits.resisted')}
              >
                {isLoading && !completedToday ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Shield size={20} />
                )}
              </button>
              {/* Relapse */}
              <button
                type="button"
                onClick={() => onRelapse?.(id)}
                disabled={isLoading}
                className="w-12 h-12 rounded-2xl grid place-items-center bg-white/[0.06] text-white/50 ring-1 ring-inset ring-white/10 hover:bg-danger-500/20 hover:text-white transition-all duration-300 active:scale-95 disabled:opacity-50"
                aria-label={t('habits.relapse')}
                title={t('habits.relapse')}
              >
                <X size={20} />
              </button>
            </>
          ) : (
            <>
              {/* Complete / Log */}
              <button
                type="button"
                onClick={handleComplete}
                disabled={isLoading || completedToday}
                className={cn(
                  'w-12 h-12 rounded-2xl grid place-items-center transition-all duration-300 relative',
                  'ring-1 ring-inset active:scale-95',
                  'focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-400/40',
                  'disabled:cursor-not-allowed',
                  completedToday
                    ? 'bg-gradient-to-br from-teal-400 to-teal-600 text-white ring-white/25 shadow-glow-teal shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] scale-105'
                    : 'bg-white/[0.06] text-teal-300 ring-white/10 hover:bg-teal-500/20 hover:text-white hover:ring-teal-400/40 hover:scale-105'
                )}
                aria-label={isMeasurable ? t('habits.logValue') : t('habits.markComplete', { name })}
                aria-pressed={completedToday}
              >
                {isLoading && !completedToday ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : isMeasurable && !completedToday ? (
                  <Timer size={20} />
                ) : (
                  <Check
                    size={20}
                    strokeWidth={completedToday ? 3 : 2}
                    className={completedToday ? 'animate-pop-in motion-reduce:animate-none' : undefined}
                  />
                )}
                {completedToday && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-gold-400 rounded-full animate-sparkle" />
                )}
              </button>
              {/* Uncomplete */}
              <button
                type="button"
                onClick={handleUncomplete}
                disabled={isLoading || !completedToday}
                className="w-12 h-12 rounded-2xl grid place-items-center bg-white/[0.06] text-white/50 ring-1 ring-inset ring-white/10 hover:bg-danger-500/20 hover:text-white transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t('habits.markIncomplete', { name })}
                aria-pressed={!completedToday}
              >
                {isLoading && completedToday ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <X size={20} strokeWidth={2} />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default HabitItem;
