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
  Compass,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { HabitItem, HabitForm, TemplateLibrary, MeasureLogger, HabitAnalytics } from '@/features/habits/components';
import { LevelUpNotification, CircularProgress } from '@/components/ui';
import { useUser, useLifeAreas, useHabits, useStreaks } from '@/store';
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
  const { habits, isLoading, loadHabits, addHabit, completeHabit, uncompleteHabit } = useHabits();
  const { user } = useUser();
  const { refreshLifeAreas } = useLifeAreas();
  const { streak } = useStreaks();

  // State for level up notifications
  const [levelUpNotification, setLevelUpNotification] = useState<LevelUpState | null>(null);

  // State for habit form (only for creation)
  const [isFormOpen, setIsFormOpen] = useState(false);

  // State for template library
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);

  // State for initial data from template
  const [templateInitialData, setTemplateInitialData] = useState<Partial<HabitFormData> | undefined>(undefined);

  // Measurable value/timer logger + analytics modal targets
  const [loggerHabitId, setLoggerHabitId] = useState<string | null>(null);
  const [analyticsHabitId, setAnalyticsHabitId] = useState<string | null>(null);

  // Active time-of-day filter pill
  const [activeFilter, setActiveFilter] = useState<RoutineFilter>('all');

  // Load habits on mount
  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  /**
   * Handle habit completion
   */
  const handleComplete = async (id: string): Promise<void> => {
    try {
      const oldLevel = user?.level || 1;

      // Complete habit (this handles points, XP, life area updates)
      await completeHabit(id);

      // Refresh life areas to get updated data
      await refreshLifeAreas();

      // Check for global level up
      const newLevel = user?.level || 1;
      if (newLevel > oldLevel) {
        // Show global level up notification
        setLevelUpNotification({
          type: 'global',
          level: newLevel,
          pointsReward: calculateGlobalLevelUpReward(newLevel),
        });
      }

      // Show success toast
      toast.success(t('habits.habitCompleted'));
    } catch (error) {
      console.error('Error completing habit:', error);
      toast.error(t('errors.habitCompleteFailed'));
    }
  };

  /**
   * Handle habit uncompletion
   */
  const handleUncomplete = async (id: string): Promise<void> => {
    try {
      await uncompleteHabit(id);

      // Refresh life areas
      await refreshLifeAreas();

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
      await completeHabit(loggerHabitId, value);
      await refreshLifeAreas();
      setLoggerHabitId(null);
      toast.success(t('timer.logged'));
    } catch (error) {
      console.error('Error logging value:', error);
      toast.error(t('errors.habitCompleteFailed'));
    }
  };

  /**
   * Register a relapse for a quit-habit (resets the streak)
   */
  const handleRelapse = async (id: string): Promise<void> => {
    const habit = habits.find((h) => h.id === id);
    if (!window.confirm(t('habits.relapseConfirm'))) return;
    try {
      if (habit?.completedToday) {
        await uncompleteHabit(id);
      }
      toast(t('habits.relapseRecorded'), { icon: '💪' });
    } catch (error) {
      console.error('Error registering relapse:', error);
      toast.error(t('errors.habitUncompleteFailed'));
    }
  };

  /**
   * Open form to create new habit
   */
  const handleCreateHabit = (): void => {
    setTemplateInitialData(undefined); // Clear any template data
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

  // Level / XP ring data for the hero badge.
  const levelProgress = user
    ? getLevelProgress(user.totalXPEarned, user.level)
    : { current: 0, max: 0, percentage: 0 };

  // Weekly streak data: prefer the real streak slice, fall back to a sensible
  // mostly-complete week so the row never renders empty/crashes.
  const weekdaysShort = (t('routines.weekdaysShort', { returnObjects: true }) as string[]) || [];
  const lastSevenDays: boolean[] =
    streak?.lastSevenDays && streak.lastSevenDays.length === 7
      ? streak.lastSevenDays
      : [true, true, true, true, true, true, false];
  const currentStreak = streak?.currentStreak ?? 0;

  // Filter pills config. Habits have no reliable time-of-day field, so the
  // non-"all" filters are visual toggles that fall back to the full list.
  const filters: { key: RoutineFilter; label: string; icon: typeof LayoutGrid }[] = [
    { key: 'all', label: t('routines.filterAll'), icon: LayoutGrid },
    { key: 'morning', label: t('routines.filterMorning'), icon: Sun },
    { key: 'afternoon', label: t('routines.filterAfternoon'), icon: CloudSun },
    { key: 'night', label: t('routines.filterNight'), icon: Moon },
  ];

  // No structured time-of-day on the habit model → show all for every filter.
  const visibleHabits = habits;

  return (
    <>
      <div className="relative min-h-screen pb-28 overflow-x-hidden">
        {/* ── Foreground content ── */}
        <div className="relative z-10 max-w-md mx-auto px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
          {/* ── Hero card (contained: bg + character + title + level + filters) ── */}
          <section className="relative rounded-3xl overflow-hidden mb-5 min-h-[212px]">
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
              src={getHeroBodySrc(user?.avatarUrl)}
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

                {/* Level ring */}
                <div className="shrink-0">
                  <CircularProgress
                    current={levelProgress.current}
                    max={levelProgress.max || 1}
                    variant="xp"
                    size={66}
                    strokeWidth={5}
                  >
                    <div className="flex flex-col items-center">
                      <Gem size={12} className="text-[#8Fb3ff]" />
                      <span className="text-[10px] font-extrabold text-white leading-none mt-0.5">
                        {t('home.levelLabel', { level: user?.level ?? 1 })}
                      </span>
                      <span className="text-white/55 text-[7px] font-medium mt-0.5">
                        {levelProgress.current} / {levelProgress.max} XP
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

          {/* Racha actual card */}
          <section
            aria-label={t('routines.currentStreak')}
            className="glass-card p-4 mb-6 flex items-center justify-between gap-3"
          >
            <div className="shrink-0">
              <p className="text-white/60 text-xs font-semibold">{t('routines.currentStreak')}</p>
              <p className="text-2xl font-extrabold text-white leading-tight mt-0.5">
                🔥 {currentStreak} <span className="text-base font-bold text-white/80">{t('routines.days')}</span>
              </p>
            </div>

            {/* 7-day row */}
            <div className="flex items-end gap-1.5">
              {weekdaysShort.map((day, index) => {
                const isToday = index === weekdaysShort.length - 1;
                const completed = lastSevenDays[index] ?? false;
                return (
                  <div key={`${day}-${index}`} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-white/50">
                      {isToday ? t('routines.today') : day}
                    </span>
                    {isToday && !completed ? (
                      <span
                        className="w-6 h-6 rounded-full border-2 border-white/25"
                        aria-label={t('routines.today')}
                      />
                    ) : (
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          completed ? 'bg-success-500 text-white' : 'bg-white/10 text-white/30'
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                );
              })}
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
                className="inline-flex items-center gap-1 rounded-full bg-teal-500 text-white text-sm font-semibold px-3 py-1.5 hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    onOpenAnalytics={(id) => setAnalyticsHabitId(id)}
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
