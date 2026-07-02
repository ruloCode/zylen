/**
 * RealmDetailSheet — bottom sheet with the detail of a focus realm (life
 * area): gem illustration, level, total light (XP), progress to the next
 * level, and the habits that feed this realm with today's completion state.
 */

import type { SyntheticEvent } from 'react';
import { X, CheckCircle2, Circle } from 'lucide-react';
import { useHabits } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { getLifeAreaMeta } from '@/constants';
import { getIcon, HABIT_ICONS } from '@/components/atoms/icons/iconMaps';
import { LevelBadge } from '@/components/ui';
import { getAreaLevelProgress } from '@/utils/xp';
import type { LifeArea } from '@/types';

interface RealmDetailSheetProps {
  area: LifeArea;
  onClose: () => void;
}

export function RealmDetailSheet({ area, onClose }: RealmDetailSheetProps) {
  const { t } = useLocale();
  const { habits } = useHabits();

  const meta = getLifeAreaMeta(area);
  const AreaIcon = getIcon(meta.iconName);
  const name = t(meta.i18nKey, { defaultValue: String(area.area) });

  const areaHabits = habits.filter((h) => h.lifeArea === area.id);
  const completedCount = areaHabits.filter((h) => h.completedToday).length;

  const prog = getAreaLevelProgress(area.totalXP, area.level);
  const pct = prog.max > 0 ? Math.min(Math.max((prog.current / prog.max) * 100, 0), 100) : 0;
  const xpToNext = Math.max(prog.max - prog.current, 0);

  const hideImageShowFallback = (e: SyntheticEvent<HTMLImageElement>): void => {
    const img = e.currentTarget;
    img.style.display = 'none';
    const fb = img.nextElementSibling as HTMLElement | null;
    if (fb) fb.style.display = 'flex';
  };

  return (
    <div
      className="fixed inset-0 z-[105] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-charcoal-500 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-soft-xl max-h-[92vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t('lifeAreaModal.title')}
      >
        {/* Header */}
        <div className="sticky top-0 bg-charcoal-500/95 backdrop-blur-md px-5 py-4 flex items-center gap-3 border-b border-white/10 z-10">
          <span className="relative w-11 h-11 grid place-items-center shrink-0">
            <img
              src={meta.image}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-contain"
              onError={hideImageShowFallback}
            />
            <span
              className="absolute inset-0 rounded-2xl hidden items-center justify-center"
              style={{ backgroundColor: `${meta.color}26`, color: meta.color }}
            >
              <AreaIcon className="w-6 h-6" />
            </span>
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{name}</h3>
            <p className="text-xs text-white/50">{t('lifeAreaModal.title')}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl grid place-items-center bg-white/10 text-white/70 hover:bg-white/15"
            aria-label={t('lifeAreaModal.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Hero: big gem over an ambient glow, plus the realm level */}
          <div className="relative flex flex-col items-center pt-2">
            <span
              aria-hidden="true"
              className="absolute inset-x-8 top-0 h-36 rounded-full"
              style={{
                background: `radial-gradient(circle at 50% 42%, ${meta.color}38, transparent 68%)`,
              }}
            />
            <span className="relative w-36 h-36 grid place-items-center">
              <img
                src={meta.image}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain drop-shadow-xl"
                onError={hideImageShowFallback}
              />
              <span
                className="absolute inset-6 rounded-full hidden items-center justify-center"
                style={{ backgroundColor: `${meta.color}26`, color: meta.color }}
              >
                <AreaIcon className="w-12 h-12" />
              </span>
            </span>
            <LevelBadge level={area.level} size="md" className="relative -mt-1" />
          </div>

          {/* Light (XP) stats and progress to the next level */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-white/50 font-medium">{t('lifeAreaModal.totalXP')}</p>
                <p className="text-xl font-bold text-gold-400 mt-0.5">{area.totalXP}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 font-medium">
                  {t('lifeAreaModal.xpToNextLevel', { level: area.level + 1 })}
                </p>
                <p className="text-xl font-bold text-white mt-0.5">{xpToNext}</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: meta.color }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-white/50 font-medium">
                {prog.current} / {prog.max} {t('progress.xp')}
              </span>
              <span className="text-[11px] text-white/50 font-medium">{Math.round(pct)}%</span>
            </div>
          </div>

          {/* Habits feeding this realm */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white">
                {t('lifeAreaModal.habitsInArea')}
              </h4>
              {areaHabits.length > 0 && (
                <span className="text-xs text-white/50 font-medium">
                  {completedCount}/{areaHabits.length} · {t('lifeAreaModal.completedToday')}
                </span>
              )}
            </div>
            {areaHabits.length === 0 ? (
              <p className="text-sm text-white/50 text-center py-6">
                {t('lifeAreaModal.noHabits')}
              </p>
            ) : (
              <div className="space-y-2">
                {areaHabits.map((habit) => {
                  const HabitIcon = HABIT_ICONS[habit.iconName];
                  const accent = habit.color || meta.color;
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-3"
                    >
                      <span
                        className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
                        style={{ backgroundColor: `${accent}26`, color: accent }}
                      >
                        {HabitIcon && <HabitIcon className="w-5 h-5" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-white truncate">
                          {habit.name}
                        </span>
                        <span className="block text-xs text-gold-400/90 font-medium">
                          +{habit.xp} XP
                        </span>
                      </span>
                      {habit.completedToday ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-white/30 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RealmDetailSheet;
