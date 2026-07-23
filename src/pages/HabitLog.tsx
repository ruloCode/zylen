import { useEffect, useState } from 'react';
import {
  Plus,
  Loader2,
  LayoutGrid,
  Sun,
  CloudSun,
  Moon,
  Gem,
  Check,
  Flame,
  Compass,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { HabitItem, HabitForm, TemplateLibrary, MeasureLogger, HabitAnalytics, HabitDetailSheet } from '@/features/habits/components';
import { LevelUpNotification, CircularProgress } from '@/components/ui';
import { useUser, useHabits, useStreaks } from '@/store';
import { calculateGlobalLevelUpReward, getLevelProgress } from '@/utils/xp';
import { useLocale } from '@/hooks/useLocale';
import { getHeroBodySrc } from '@/constants';
import type { HabitFormData, HabitTemplate } from '@/types';

interface LevelUpState {
  type: 'global' | 'area';
  level: number;
  areaName?: string;
  pointsReward: number;
}

type RoutineFilter = 'all' | 'morning' | 'afternoon' | 'night';

// Hero layers (shared visual language with Dashboard).
// The character body is resolved from the user's chosen avatar (see getHeroBodySrc).
const HERO_BG_SRC = '/hero-bg.png';

export function HabitLog() {
  const { t } = useLocale();

  // Use the new async hooks
  const { habits, isLoading, loadHabits, addHabit, updateHabit, completeHabit, uncompleteHabit, recordRelapse } = useHabits();
  const { user } = useUser();
  const { streak, refreshStreak } = useStreaks();

  // State for level up notifications
  const [levelUpNotification, setLevelUpNotification] = useState<LevelUpState | null>(null);

  // State for habit form (only for creation)
  const [isFormOpen, setIsFormOpen] = useState(false);

  // State for template library
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);

  // State for initial data from template
  const [templateInitialData, setTemplateInitialData] = useState<Partial<HabitFormData> | undefined>(undefined);

  // Measurable value/timer logger + detail/analytics/edit modal targets
  const [loggerHabitId, setLoggerHabitId] = useState<string | null>(null);
  const [analyticsHabitId, setAnalyticsHabitId] = useState<string | null>(null);
  const [detailHabitId, setDetailHabitId] = useState<string | null>(null);
  const [editHabitId, setEditHabitId] = useState<string | null>(null);

  // Active time-of-day filter pill
  const [activeFilter, setActiveFilter] = useState<RoutineFilter>('all');

  // Load habits + realign the streak strip on mount. refreshStreak recomputes
  // last_seven_days so its last slot is *today* even if nothing was completed
  // yet — otherwise the weekly tracker could show a stale (previous) day.
  // The midnight rollover itself is handled app-wide in AppProvider.
  useEffect(() => {
    loadHabits();
    refreshStreak();
  }, [loadHabits, refreshStreak]);

  /**
   * Handle habit completion
   */
  const handleComplete = async (id: string) => {
    try {
      // Complete habit — the RPC returns the awarded XP (streak bonus +
      // daily cap applied) and whether the user leveled up.
      const result = await completeHabit(id);

      if (result.leveledUp && result.newLevel) {
        setLevelUpNotification({
          type: 'global',
          level: result.newLevel,
          pointsReward: calculateGlobalLevelUpReward(result.newLevel),
        });
      }

      // Success toast with the real XP awarded + bonus/cap hints
      const bonusPercent = Math.round(((result.streakMultiplier ?? 1) - 1) * 100);
      let message = `${t('habits.habitCompleted')} +${result.xpEarned} ${t('common.xp')}`;
      if (bonusPercent > 0) {
        message += ` · ${t('habits.streakBonus', { percent: bonusPercent })}`;
      }
      if (result.capped) {
        toast(t('habits.xpCapped'), { icon: '🌙', duration: 3500 });
      }
      toast.success(message);
      return result;
    } catch (error) {
      console.error('Error completing habit:', error);
      toast.error(t('errors.habitCompleteFailed'));
      // Re-throw so HabitItem's own catch suppresses the success burst.
      throw error;
    }
  };

  /**
   * Handle habit uncompletion
   */
  const handleUncomplete = async (id: string): Promise<void> => {
    try {
      await uncompleteHabit(id);

      // Show success toast
      toast.success(t('habits.habitUncompleted'));
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      toast.error(t('errors.habitUncompleteFailed'));
    }
  };

  /**
   * Save a measurable value (from the timer/value logger)
   */
  const handleLogValue = async (value: number): Promise<void> => {
    if (!loggerHabitId) return;
    try {
      const result = await completeHabit(loggerHabitId, value);
      setLoggerHabitId(null);
      if (result.leveledUp && result.newLevel) {
        setLevelUpNotification({
          type: 'global',
          level: result.newLevel,
          pointsReward: calculateGlobalLevelUpReward(result.newLevel),
        });
      }
      toast.success(`${t('timer.logged')} +${result.xpEarned} ${t('common.xp')}`);
    } catch (error) {
      console.error('Error logging value:', error);
      toast.error(t('errors.habitCompleteFailed'));
    }
  };

  /**
   * Register a relapse for a quit-habit: persists the relapse event and
   * reverts today's completion server-side (streak recomputed).
   */
  const handleRelapse = async (id: string): Promise<void> => {
    if (!window.confirm(t('habits.relapseConfirm'))) return;
    try {
      await recordRelapse(id);
      toast(t('habits.relapseRecorded'), { icon: '💪' });
    } catch (error) {
      console.error('Error registering relapse:', error);
      toast.error(t('errors.habitUncompleteFailed'));
    }
  };

  /**
   * Start habit creation: open the suggested-habits catalog first; the user
   * can pick a template (detail sheet → prefilled form) or jump to a custom
   * habit from there.
   */
  const handleCreateHabit = (): void => {
    setTemplateInitialData(undefined); // Clear any template data
    setIsTemplateLibraryOpen(true);
  };

  /**
   * Create a habit from scratch (from the catalog's custom option)
   */
  const handleCreateCustomHabit = (): void => {
    setIsTemplateLibraryOpen(false);
    setTemplateInitialData(undefined);
    setIsFormOpen(true);
  };

  /**
   * Handle template selection from library
   */
  const handleSelectTemplate = (data: Partial<HabitFormData>, _template: HabitTemplate): void => {
    setIsTemplateLibraryOpen(false);
    setTemplateInitialData(data);
    setIsFormOpen(true);
  };

  /**
   * Handle form submission (create only)
   */
  const handleFormSubmit = async (data: HabitFormData): Promise<void> => {
    try {
      await addHabit(data);

      toast.success(t('habits.habitCreated'));

      // Close form and clear template data
      setIsFormOpen(false);
      setTemplateInitialData(undefined);
    } catch (error) {
      console.error('Error creating habit:', error);
      toast.error(t('errors.habitCreateFailed'));
    }
  };

  /**
   * Handle form cancel
   */
  const handleFormCancel = (): void => {
    setIsFormOpen(false);
    setTemplateInitialData(undefined);
  };

  /**
   * Handle edit form submission (opened from the detail sheet)
   */
  const handleEditSubmit = async (data: HabitFormData): Promise<void> => {
    if (!editHabitId) return;
    try {
      await updateHabit(editHabitId, data);
      toast.success(t('habitDetail.saved'));
      setEditHabitId(null);
    } catch (error) {
      console.error('Error updating habit:', error);
      toast.error(t('errors.habitUpdateFailed'));
    }
  };

  // Level / XP ring data for the hero badge.
  const levelProgress = user
    ? getLevelProgress(user.totalXPEarned, user.level)
    : { current: 0, max: 0, percentage: 0 };

  // Weekly streak data from the server-refreshed streak (never invented).
  // lastSevenDays is oldest-first with index 6 = TODAY (server computes it in
  // the user's timezone, kept in sync with the device; refreshStreak realigns
  // it on load). We render a fixed Monday→Sunday calendar week aligned to the
  // device's local date, so "today" lights up its real weekday column instead
  // of always sitting in the last (Sunday) slot.
  const weekdaysShort = (t('routines.weekdaysShort', { returnObjects: true }) as string[]) || [];
  const lastSevenDays: boolean[] =
    streak?.lastSevenDays && streak.lastSevenDays.length === 7
      ? streak.lastSevenDays
      : [false, false, false, false, false, false, false];
  const currentStreak = streak?.currentStreak ?? 0;

  // Monday-based index of today: JS getDay() is 0=Sun..6=Sat.
  const todayMondayIndex = (new Date().getDay() + 6) % 7;
  const weekDays = weekdaysShort.map((label, position) => {
    // offset < 0 → earlier this week · 0 → today · > 0 → still to come
    const offset = position - todayMondayIndex;
    return {
      label,
      isToday: offset === 0,
      isUpcoming: offset > 0,
      completed: offset <= 0 ? lastSevenDays[6 + offset] ?? false : false,
    };
  });

  // Filter pills config, backed by the habit's time_of_day field.
  const filters: { key: RoutineFilter; label: string; icon: typeof LayoutGrid }[] = [
    { key: 'all', label: t('routines.filterAll'), icon: LayoutGrid },
    { key: 'morning', label: t('routines.filterMorning'), icon: Sun },
    { key: 'afternoon', label: t('routines.filterAfternoon'), icon: CloudSun },
    { key: 'night', label: t('routines.filterNight'), icon: Moon },
  ];

  // 'anytime' habits show under every filter; the UI's "night" maps to the
  // model's 'evening'.
  const visibleHabits =
    activeFilter === 'all'
      ? habits
      : habits.filter((h) => {
          const tod = h.timeOfDay ?? 'anytime';
          if (tod === 'anytime') return true;
          return activeFilter === 'night' ? tod === 'evening' : tod === activeFilter;
        });

  return (
    <>
      <div className="relative min-h-screen pb-28 overflow-x-hidden">
        {/* ── Foreground content ── */}
        <div className="relative z-10 max-w-md mx-auto px-4 pt-[calc(env(safe-area-inset-top)+1rem)] animate-page-in">
          {/* ── Hero card (contained: bg + character + title + level + filters) ── */}
          <section className="relative rounded-3xl overflow-hidden mb-5 min-h-[212px] ring-1 ring-inset ring-white/10 shadow-soft-xl">
            {/* Background scene */}
            <img
              src={HERO_BG_SRC}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            {/* Scrims: darken the left (title) and bottom (chips) for legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--background))]/90 via-[hsl(var(--background))]/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
            {/* Character bust on the right: head at the top, lower body clipped by the card */}
            <img
              src={getHeroBodySrc(user?.avatarUrl, user?.avatarBodyUrl)}
              alt=""
              aria-hidden="true"
              className="absolute top-2 left-[57%] -translate-x-1/2 w-[47%] max-w-[190px] h-auto object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.45)]"
              onError={(e) => {
                e.currentTarget.style.opacity = '0';
              }}
            />

            {/* Card content */}
            <div className="relative z-10 flex flex-col min-h-[212px] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="font-sans normal-case text-[30px] leading-tight font-extrabold text-white tracking-tight">
                    {t('routines.title')}
                  </h1>
                  <p className="font-sans text-white/75 text-[14px] font-medium mt-1.5 max-w-[9rem] leading-snug">
                    {t('routines.subtitle')}
                  </p>
                </div>

                {/* Level badge — eyebrow + level beside a compact ring so nothing
                    crowds the circle; glass backdrop keeps it legible over the character */}
                <div className="shrink-0 flex items-center gap-2 rounded-2xl bg-black/35 backdrop-blur-md ring-1 ring-inset ring-white/10 py-1.5 pl-2.5 pr-1.5">
                  <div className="flex flex-col items-end text-right leading-tight">
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8Fb3ff]">
                      {t('home.guardianTitle')}
                    </span>
                    <span className="text-[13px] font-extrabold text-white leading-tight">
                      {t('home.levelShort', { level: user?.level ?? 1 })}
                    </span>
                  </div>
                  <CircularProgress
                    current={levelProgress.current}
                    max={levelProgress.max || 1}
                    variant="xp"
                    size={50}
                    strokeWidth={5}
                  >
                    <div className="flex flex-col items-center">
                      <Gem size={12} className="text-[#8Fb3ff]" />
                      <span className="text-[13px] font-extrabold text-white leading-none mt-0.5">
                        {levelProgress.current}
                      </span>
                      <span className="text-white/55 text-[7px] font-medium leading-none mt-0.5">
                        /{levelProgress.max} {t('common.xp')}
                      </span>
                    </div>
                  </CircularProgress>
                </div>
              </div>

              {/* Filter pills pinned to the bottom of the card */}
              <div
                className="mt-auto pt-5 flex items-center gap-2 overflow-x-auto -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="tablist"
                aria-label={t('routines.myRoutines')}
              >
                {filters.map(({ key, label, icon: Icon }) => {
                  const isActive = activeFilter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveFilter(key)}
                      className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                        isActive
                          ? 'bg-teal-500 text-white shadow-glow-teal'
                          : 'bg-black/30 backdrop-blur-md border border-white/10 text-white/80 hover:text-white'
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Racha actual — AAA streak tracker (flame medallion + 7-day path) */}
          <section
            aria-label={t('routines.currentStreak')}
            className="glass-card relative overflow-hidden p-4 mb-6 ring-1 ring-inset ring-white/[0.06]"
          >
            {/* Warm ember glow + top gloss */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full bg-gold-500/15 blur-3xl"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />

            {/* Header: flame medallion + streak count */}
            <div className="relative flex items-center gap-3 mb-4">
              <div className="relative shrink-0">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-gold-500/50 blur-md animate-glow-pulse"
                />
                <div className="relative w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-br from-gold-400 to-orange-600 ring-1 ring-inset ring-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45)]">
                  <Flame size={24} className="text-white fill-white/30" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-white/55 text-[11px] font-bold uppercase tracking-wider">
                  {t('routines.currentStreak')}
                </p>
                <p className="text-[26px] font-extrabold leading-none mt-0.5">
                  <span className="text-shimmer-gold">{currentStreak}</span>{' '}
                  <span className="text-sm font-bold text-white/70">
                    {t('progress.daysCount', { count: currentStreak })}
                  </span>
                </p>
              </div>
            </div>

            {/* 7-day tracker: connecting path behind glowing nodes */}
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-4 right-4 top-4 -translate-y-1/2 h-0.5 rounded-full bg-white/10"
              />
              <div className="relative flex justify-between gap-1">
                {weekDays.map(({ label, isToday, isUpcoming, completed }, index) => (
                  <div
                    key={`${label}-${index}`}
                    className="relative z-10 flex flex-col items-center gap-1.5 min-w-0"
                  >
                    {completed ? (
                      <span className="w-8 h-8 rounded-full grid place-items-center bg-gradient-to-br from-success-400 to-success-600 text-white ring-1 ring-inset ring-white/25 shadow-[0_0_10px_hsl(150_55%_45%/0.55)]">
                        <Check size={15} strokeWidth={3} />
                      </span>
                    ) : isToday ? (
                      <span
                        className="w-8 h-8 rounded-full grid place-items-center bg-teal-400/10 ring-2 ring-teal-400/60 animate-glow-pulse"
                        aria-label={t('routines.today')}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />
                      </span>
                    ) : (
                      <span
                        className={`w-8 h-8 rounded-full bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] ${
                          isUpcoming ? 'opacity-40' : ''
                        }`}
                      />
                    )}
                    <span
                      className={`text-[10px] font-semibold truncate max-w-full ${
                        isToday
                          ? 'text-teal-300'
                          : isUpcoming
                            ? 'text-white/25'
                            : 'text-white/45'
                      }`}
                    >
                      {isToday ? t('routines.today') : label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Mis rutinas */}
          <section aria-labelledby="my-routines-heading" className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 id="my-routines-heading" className="font-sans normal-case text-xl font-bold text-white">
                {t('routines.myRoutines')}
              </h2>
              <button
                type="button"
                onClick={handleCreateHabit}
                disabled={isLoading}
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white text-sm font-semibold px-3.5 py-1.5 ring-1 ring-inset ring-white/20 shadow-glow-teal transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('routines.newRoutine')}
              >
                <Plus size={16} />
                {t('routines.newRoutine')}
              </button>
            </div>

            {/* Loading state */}
            {isLoading && habits.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              </div>
            )}

            {/* Empty state */}
            {!isLoading && habits.length === 0 && (
              <div className="glass-card rounded-2xl p-8 text-center">
                <p className="text-white/80 font-semibold mb-4">{t('routines.empty')}</p>
                <button type="button" onClick={handleCreateHabit} className="btn-primary">
                  {t('habits.createFirstHabit')}
                </button>
              </div>
            )}

            {/* Habits list */}
            {visibleHabits.length > 0 && (
              <div className="space-y-2.5 sm:space-y-3">
                {visibleHabits.map((habit) => (
                  <HabitItem
                    key={habit.id}
                    id={habit.id}
                    name={habit.name}
                    iconName={habit.iconName}
                    xp={habit.xp}
                    completedToday={habit.completedToday}
                    lifeArea={habit.lifeArea}
                    habitType={habit.habitType}
                    unit={habit.unit}
                    dailyGoal={habit.dailyGoal}
                    todayValue={habit.todayValue}
                    onComplete={handleComplete}
                    onUncomplete={handleUncomplete}
                    onLog={(id) => setLoggerHabitId(id)}
                    onRelapse={handleRelapse}
                    onOpenAnalytics={(id) => setDetailHabitId(id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Banner */}
          <button
            type="button"
            onClick={() => setIsTemplateLibraryOpen(true)}
            className="w-full glass-card p-4 flex items-center gap-3 text-left bg-gradient-to-br from-teal-500/10 to-gold-500/10"
          >
            <span className="shrink-0 w-11 h-11 rounded-full bg-gold-500/15 flex items-center justify-center">
              <Compass size={22} className="text-gold-400" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-white text-sm font-bold leading-snug">
                {t('routines.bannerTitle')}
              </span>
              <span className="block text-white/55 text-xs mt-0.5">{t('routines.bannerSubtitle')}</span>
            </span>
            <ChevronRight size={20} className="text-white/40 shrink-0" />
          </button>
        </div>
      </div>

      {/* Level Up Notification */}
      {levelUpNotification && (
        <LevelUpNotification
          level={levelUpNotification.level}
          type={levelUpNotification.type}
          areaName={levelUpNotification.areaName}
          pointsReward={levelUpNotification.pointsReward}
          onClose={() => setLevelUpNotification(null)}
        />
      )}

      {/* Habit Form (Create only) */}
      {isFormOpen && (
        <HabitForm
          initialData={templateInitialData}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      {/* Template Library Modal */}
      {isTemplateLibraryOpen && (
        <TemplateLibrary
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setIsTemplateLibraryOpen(false)}
          onCreateCustom={handleCreateCustomHabit}
        />
      )}

      {/* Measurable value / timer logger */}
      {loggerHabitId && (() => {
        const h = habits.find((x) => x.id === loggerHabitId);
        if (!h) return null;
        return (
          <MeasureLogger
            habitName={h.name}
            unit={h.unit || 'min'}
            dailyGoal={h.dailyGoal}
            onSave={handleLogValue}
            onClose={() => setLoggerHabitId(null)}
          />
        );
      })()}

      {/* Habit detail sheet (tap on a habit) */}
      {detailHabitId && (() => {
        const h = habits.find((x) => x.id === detailHabitId);
        if (!h) return null;
        return (
          <HabitDetailSheet
            habit={h}
            onClose={() => setDetailHabitId(null)}
            onOpenAnalytics={(id) => {
              setDetailHabitId(null);
              setAnalyticsHabitId(id);
            }}
            onOpenEdit={(id) => {
              setDetailHabitId(null);
              setEditHabitId(id);
            }}
            onRelapse={(id) => {
              setDetailHabitId(null);
              handleRelapse(id);
            }}
          />
        );
      })()}

      {/* Habit Form (edit, opened from the detail sheet) */}
      {editHabitId && (() => {
        const h = habits.find((x) => x.id === editHabitId);
        if (!h) return null;
        return (
          <HabitForm
            habit={{ ...h, completed: h.completedToday }}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditHabitId(null)}
          />
        );
      })()}

      {/* Per-habit analytics */}
      {analyticsHabitId && (() => {
        const h = habits.find((x) => x.id === analyticsHabitId);
        if (!h) return null;
        return (
          <HabitAnalytics
            habitId={h.id}
            habitName={h.name}
            habitType={h.habitType}
            unit={h.unit}
            onClose={() => setAnalyticsHabitId(null)}
          />
        );
      })()}
    </>
  );
}

export default HabitLog;
