/**
 * Zylen v2 HabitItem
 * Evolved habit tile: rounded glass card, teal completion glow, gold XP,
 * streak flame, and support for check / measurable / quit habit types.
 */

import React, { useState } from 'react';
import { Check, X, Loader2, Flame, Shield, Timer } from 'lucide-react';
import { cn } from '@/utils';
import { XPBadge } from '@/components/ui';
import { HABIT_ICONS } from './IconSelector';
import { useLifeAreas } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import type { HabitType } from '@/types';

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
  onComplete: (id: string) => Promise<void>;
  onUncomplete: (id: string) => Promise<void>;
  /** measurable: open the value/timer logger */
  onLog?: (id: string) => void;
  /** quit: register a relapse (resets streak) */
  onRelapse?: (id: string) => void;
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
}: HabitItemProps) {
  const { t } = useLocale();
  const { lifeAreas } = useLifeAreas();
  const [isLoading, setIsLoading] = useState(false);

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
      await onComplete(id);
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
        'glass-card p-3 sm:p-4 transition-all duration-300 relative overflow-hidden group',
        completedToday
          ? isQuit
            ? 'border-cyan-400/50 shadow-glow-teal'
            : 'border-teal-400/50 shadow-glow-teal'
          : 'hover:-translate-y-0.5 hover:shadow-soft-lg'
      )}
      aria-label={`Habit: ${name}`}
    >
      {/* Completion glow wash */}
      {completedToday && (
        <div
          className={cn(
            'absolute inset-x-0 -top-8 h-20 opacity-30 animate-glow-pulse pointer-events-none blur-2xl',
            isQuit ? 'bg-cyan-400/40' : 'bg-teal-400/40'
          )}
        />
      )}

      <div className="flex items-center gap-3 relative z-10">
        {/* Icon */}
        <div
          className={cn(
            'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl grid place-items-center transition-all duration-300 flex-shrink-0',
            completedToday
              ? isQuit
                ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-glow-teal'
                : 'bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-glow-teal'
              : 'bg-white/[0.06] text-teal-300 group-hover:bg-white/[0.1]'
          )}
        >
          <IconComponent size={22} />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-white truncate">{name}</h3>
            {streak > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-gold-400 flex-shrink-0">
                <Flame size={13} className="fill-gold-400/30" />
                {streak}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <XPBadge xp={xp} size="sm" />
            {isQuit && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-cyan-500/20 text-cyan-200">
                <Shield size={11} /> {t('habits.quitBadge')}
              </span>
            )}
            {isMeasurable && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-teal-500/20 text-teal-200">
                {todayValue ? `${todayValue}` : '0'}
                {dailyGoal ? `/${dailyGoal}` : ''} {unit || ''}
              </span>
            )}
            {!isQuit && !isMeasurable && lifeAreaName && (
              <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-white/10 text-white/80">
                {lifeAreaName}
              </span>
            )}
          </div>

          {/* Measurable progress bar */}
          {isMeasurable && dailyGoal ? (
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          ) : null}
        </div>

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
                  'focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/40',
                  'disabled:cursor-not-allowed',
                  completedToday
                    ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-glow-teal scale-105'
                    : 'bg-white/[0.06] text-cyan-300 hover:bg-cyan-500/20 hover:scale-105'
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
                className="w-12 h-12 rounded-2xl grid place-items-center bg-white/[0.06] text-white/50 hover:bg-danger-500/20 hover:text-white transition-all duration-300 disabled:opacity-50"
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
                  'focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-400/40',
                  'disabled:cursor-not-allowed',
                  completedToday
                    ? 'bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-glow-teal scale-105'
                    : 'bg-white/[0.06] text-teal-300 hover:bg-teal-500/20 hover:text-white hover:scale-105'
                )}
                aria-label={isMeasurable ? t('habits.logValue') : `Mark ${name} as complete`}
                aria-pressed={completedToday}
              >
                {isLoading && !completedToday ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : isMeasurable && !completedToday ? (
                  <Timer size={20} />
                ) : (
                  <Check size={20} strokeWidth={completedToday ? 3 : 2} />
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
                className="w-12 h-12 rounded-2xl grid place-items-center bg-white/[0.06] text-white/50 hover:bg-danger-500/20 hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={`Mark ${name} as incomplete`}
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
