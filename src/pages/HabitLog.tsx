import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { HabitItem, HabitForm } from '@/features/habits/components';
import { LevelUpNotification } from '@/components/ui';
import { useUser, useLifeAreas, useAppStore } from '@/store';
import { calculateGlobalLevelUpReward, calculateAreaLevelUpReward } from '@/utils/xp';
import { useLocale } from '@/hooks/useLocale';
import type { Habit, HabitFormData } from '@/types';

interface LevelUpState {
  type: 'global' | 'area';
  level: number;
  areaName?: string;
  pointsReward: number;
}

export function HabitLog() {
  const { t } = useLocale();

  // Select individual values instead of objects to avoid re-render loops
  const habits = useAppStore((state) => state.habits);
  const loadHabits = useAppStore((state) => state.loadHabits);
  const addHabit = useAppStore((state) => state.addHabit);
  const toggleHabit = useAppStore((state) => state.toggleHabit);
  const updateXP = useAppStore((state) => state.updateXP);
  const updateStreakForToday = useAppStore((state) => state.updateStreakForToday);
  const { user } = useUser();
  const { refreshLifeAreas } = useLifeAreas();

  // State for level up notifications
  const [levelUpNotification, setLevelUpNotification] = useState<LevelUpState | null>(null);

  // State for habit form (only for creation)
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Load habits on mount or initialize with default habits if empty
  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  // Initialize with default habits if none exist (separate effect to avoid loops)
  // Memoize default habits to prevent recreation on every render
  const defaultHabits = useMemo<Habit[]>(() => [
    {
      id: '1',
      name: 'Morning Workout',
      iconName: 'Dumbbell',
      xp: 50,
      completed: false,
      lifeArea: 'health', // Physical exercise → Health
    },
    {
      id: '2',
      name: 'Read 30 Minutes',
      iconName: 'Book',
      xp: 30,
      completed: false,
      lifeArea: 'creativity', // Reading fosters creativity
    },
    {
      id: '3',
      name: 'Eat Healthy Meal',
      iconName: 'Apple',
      xp: 25,
      completed: false,
      lifeArea: 'health', // Nutrition → Health
    },
    {
      id: '4',
      name: 'Sleep 8 Hours',
      iconName: 'Bed',
      xp: 40,
      completed: false,
      lifeArea: 'health', // Rest → Health
    },
    {
      id: '5',
      name: 'Drink 2L Water',
      iconName: 'Droplets',
      xp: 20,
      completed: false,
      lifeArea: 'health', // Hydration → Health
    },
    {
      id: '6',
      name: 'Meditate 10 Min',
      iconName: 'Brain',
      xp: 35,
      completed: false,
      lifeArea: 'health', // Mental health → Health
    },
  ], []);

  useEffect(() => {
    if (habits.length === 0) {
      // Add default habits to store
      defaultHabits.forEach(habit => {
        addHabit(habit);
      });
    }
  }, [habits.length, addHabit, defaultHabits]);

  /**
   * Handle habit toggle (completion)
   */
  const handleToggle = (id: string, completed: boolean) => {
    const oldLevel = user?.level || 1;

    // Toggle habit and get result (includes XP and potential area level up)
    const { xpEarned, areaLevelUp } = toggleHabit(id, completed);

    // Update user XP (this may trigger global level up)
    updateXP(xpEarned);

    // Refresh life areas to get updated data
    refreshLifeAreas();

    // Check for global level up
    const newLevel = user?.level || 1;
    if (newLevel > oldLevel && completed) {
      // Show global level up notification
      setLevelUpNotification({
        type: 'global',
        level: newLevel,
        pointsReward: calculateGlobalLevelUpReward(newLevel),
      });
    }
    // Check for area level up
    else if (areaLevelUp && completed) {
      // Show area level up notification
      setLevelUpNotification({
        type: 'area',
        level: areaLevelUp.newLevel,
        areaName: areaLevelUp.area,
        pointsReward: calculateAreaLevelUpReward(areaLevelUp.newLevel),
      });
    }

    // Update streak based on completion
    const completedHabits = habits.filter(h => h.completed).length + (completed ? 1 : -1);
    const allCompleted = completedHabits === habits.length;
    updateStreakForToday(allCompleted);
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
  const handleFormSubmit = (data: HabitFormData) => {
    // Create new habit
    const newHabit: Habit = {
      id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      completed: false,
      points: data.xp * 0.5, // Calculate points
      createdAt: new Date(),
    };
    addHabit(newHabit);

    // Close form
    setIsFormOpen(false);
  };

  /**
   * Handle form cancel
   */
  const handleFormCancel = () => {
    setIsFormOpen(false);
  };

  const completedCount = habits.filter(h => h.completed).length;
  const totalXP = habits.filter(h => h.completed).reduce((sum, h) => sum + h.xp, 0);

  // Determine motivational message based on completion
  const getMotivationalMessage = () => {
    if (completedCount === habits.length) return t('habits.perfectDay');
    if (completedCount > habits.length / 2) return t('habits.greatProgress');
    return t('habits.everyStepCounts');
  };

  return <>
      <div className="min-h-screen pb-24 px-3 sm:px-4 pt-6 sm:pt-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <header className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                {t('habits.dailyQuests')}
              </h1>
              <button
                onClick={handleCreateHabit}
                className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors shadow-lg hover:shadow-xl hover:scale-110 flex-shrink-0"
                aria-label={t('habitForm.createHabit')}
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <p className="text-sm sm:text-base text-gray-700 font-semibold">{t('habits.completeHabitsToEarnXP')}</p>
          </header>

          {/* Progress Summary */}
          <section aria-labelledby="progress-heading" className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="sr-only" id="progress-heading">Progress Summary</h2>
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900" aria-live="polite" aria-atomic="true">
                  {completedCount}/{habits.length}
                </div>
                <div className="text-sm sm:text-base text-gray-700 font-semibold mt-1">{t('habits.completedToday')}</div>
              </div>
              <div className="text-right flex-1">
                <div className="text-3xl sm:text-4xl font-bold text-gold-700" aria-live="polite" aria-atomic="true">
                  +{totalXP}
                </div>
                <div className="text-sm sm:text-base text-gray-700 font-semibold mt-1">{t('habits.xpEarned')}</div>
              </div>
            </div>
          </section>

          {/* Habits List */}
          <section aria-labelledby="habits-heading" className="mb-6 sm:mb-8">
            <h2 className="sr-only" id="habits-heading">{t('habits.yourDailyHabits')}</h2>
            <div className="space-y-2.5 sm:space-y-3">
              {habits.map(habit => (
                <HabitItem
                  key={habit.id}
                  {...habit}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </section>

          {/* Motivational Message */}
          <aside className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center bg-gradient-to-br from-teal-50/80 to-gold-50/60" role="status" aria-live="polite">
            <p className="text-gray-900 font-bold text-base sm:text-lg mb-2">
              {getMotivationalMessage()}
            </p>
            <p className="text-sm sm:text-base text-gray-700 font-semibold">{t('habits.coachBelievesInYou')}</p>
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
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </>;
}