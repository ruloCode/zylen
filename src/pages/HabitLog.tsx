import React, { useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { HabitItem, HabitForm } from '@/features/habits/components';
import { LevelUpNotification } from '@/components/ui';
import { useUser, useLifeAreas, useHabits } from '@/store';
import { calculateGlobalLevelUpReward, calculateAreaLevelUpReward } from '@/utils/xp';
import { useLocale } from '@/hooks/useLocale';
import type { HabitFormData } from '@/types';

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
   * Open form to create new habit
   */
  const handleCreateHabit = () => {
    setIsFormOpen(true);
  };

  /**
   * Handle form submission (create only)
   */
  const handleFormSubmit = async (data: HabitFormData) => {
    try {
      await addHabit(data);

      toast.success(t('habits.habitCreated'));

      // Close form
      setIsFormOpen(false);
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
              <button
                onClick={handleCreateHabit}
                disabled={isLoading}
                className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors shadow-lg hover:shadow-xl hover:scale-110 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('habitForm.createHabit')}
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
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
                    onComplete={handleComplete}
                    onUncomplete={handleUncomplete}
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
        <HabitForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} />
      )}
    </>
  );
}
