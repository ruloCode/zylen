import React, { useEffect, useState } from 'react';
import { Plus, Loader2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { HabitItem, HabitForm, TemplateLibrary, MeasureLogger, HabitAnalytics } from '@/features/habits/components';
import { LevelUpNotification } from '@/components/ui';
import { useUser, useLifeAreas, useHabits } from '@/store';
import { calculateGlobalLevelUpReward, calculateAreaLevelUpReward } from '@/utils/xp';
import { useLocale } from '@/hooks/useLocale';
import type { HabitFormData, HabitTemplate } from '@/types';

interface LevelUpState {
  type: 'global' | 'area';
  level: number;
  areaName?: string;
  pointsReward: number;
}

export function HabitLog() {
  const { t } = useLocale();

  // Use the new async hooks
  const { habits, isLoading, loadHabits, addHabit, completeHabit, uncompleteHabit } = useHabits();
  const { user } = useUser();
  const { refreshLifeAreas } = useLifeAreas();

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

  // Load habits on mount
  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  /**
   * Handle habit completion
   */
  const handleComplete = async (id: string) => {
    try {
      const oldLevel = user?.level || 1;

      // Complete habit (this handles points, XP, life area updates)
      const result = await completeHabit(id);

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
  const handleUncomplete = async (id: string) => {
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
  const handleLogValue = async (value: number) => {
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
  const handleRelapse = async (id: string) => {
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
  const handleCreateHabit = () => {
    setTemplateInitialData(undefined); // Clear any template data
    setIsFormOpen(true);
  };

  /**
   * Open template library
   */
  const handleOpenTemplateLibrary = () => {
    setIsTemplateLibraryOpen(true);
  };

  /**
   * Handle template selection from library
   */
  const handleSelectTemplate = (data: Partial<HabitFormData>, template: HabitTemplate) => {
    setIsTemplateLibraryOpen(false);
    setTemplateInitialData(data);
    setIsFormOpen(true);
  };

  /**
   * Handle form submission (create only)
   */
  const handleFormSubmit = async (data: HabitFormData) => {
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
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setTemplateInitialData(undefined);
  };

  const completedCount = habits.filter((h) => h.completedToday).length;
  const totalXP = habits
    .filter((h) => h.completedToday)
    .reduce((sum, h) => sum + h.xp, 0);

  // Determine motivational message based on completion
  const getMotivationalMessage = () => {
    if (habits.length === 0) return t('habits.addYourFirstHabit');
    if (completedCount === habits.length) return t('habits.perfectDay');
    if (completedCount > habits.length / 2) return t('habits.greatProgress');
    return t('habits.everyStepCounts');
  };

  return (
    <>
      <div className="min-h-screen pb-24 px-2 pt-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <header className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {t('habits.dailyQuests')}
              </h1>
              <div className="flex items-center gap-2">
                {/* Browse Templates Button */}
                <button
                  onClick={handleOpenTemplateLibrary}
                  disabled={isLoading}
                  className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors shadow-lg hover:shadow-xl hover:scale-110 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t('templates.browseTemplates')}
                  title={t('templates.browseTemplates')}
                >
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                {/* Create Habit Button */}
                <button
                  onClick={handleCreateHabit}
                  disabled={isLoading}
                  className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors shadow-lg hover:shadow-xl hover:scale-110 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t('habitForm.createHabit')}
                >
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            <p className="text-sm sm:text-base text-white font-semibold">
              {t('habits.completeHabitsToEarnXP')}
            </p>
          </header>

          {/* Progress Summary */}
          <section
            aria-labelledby="progress-heading"
            className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8"
          >
            <h2 className="sr-only" id="progress-heading">
              Progress Summary
            </h2>
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1">
                <div
                  className="text-3xl sm:text-4xl font-bold text-white"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {completedCount}/{habits.length}
                </div>
                <div className="text-sm sm:text-base text-white font-semibold mt-1">
                  {t('habits.completedToday')}
                </div>
              </div>
              <div className="text-right flex-1">
                <div
                  className="text-3xl sm:text-4xl font-bold text-[rgb(155,215,50)]"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  +{totalXP}
                </div>
                <div className="text-sm sm:text-base text-white font-semibold mt-1">
                  {t('habits.xpEarned')}
                </div>
              </div>
            </div>
          </section>

          {/* Loading State */}
          {isLoading && habits.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && habits.length === 0 && (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-8 text-center">
              <p className="text-white font-semibold mb-4">
                {t('habits.noHabitsYet')}
              </p>
              <button
                onClick={handleCreateHabit}
                className="btn-primary"
              >
                {t('habits.createFirstHabit')}
              </button>
            </div>
          )}

          {/* Habits List */}
          {habits.length > 0 && (
            <section aria-labelledby="habits-heading" className="mb-6 sm:mb-8">
              <h2 className="sr-only" id="habits-heading">
                {t('habits.yourDailyHabits')}
              </h2>
              <div className="space-y-2.5 sm:space-y-3">
                {habits.map((habit) => (
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
            </section>
          )}

          {/* Motivational Message */}
          <aside
            className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center bg-gradient-to-br from-teal-500/10 to-gold-500/10"
            role="status"
            aria-live="polite"
          >
            <p className="text-white font-bold text-base sm:text-lg mb-2">
              {getMotivationalMessage()}
            </p>
            <p className="text-sm sm:text-base text-white font-semibold">
              {t('habits.coachBelievesInYou')}
            </p>
          </aside>
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
