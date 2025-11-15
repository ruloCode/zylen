import React, { useEffect } from 'react';
import { Dumbbell, Book, Apple, Bed, Droplets, Brain } from 'lucide-react';
import { HabitItem } from '@/features/habits/components';
import { useHabits, useUser, useStreaks } from '@/store';
import type { Habit } from '@/types';

export function HabitLog() {
  const { habits, loadHabits, addHabit, toggleHabit } = useHabits();
  const { updateXP } = useUser();
  const { updateStreakForToday } = useStreaks();

  // Load habits on mount or initialize with default habits if empty
  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  // Initialize with default habits if none exist (separate effect to avoid loops)
  useEffect(() => {
    if (habits.length === 0) {
      const defaultHabits: Habit[] = [
        {
          id: '1',
          name: 'Morning Workout',
          iconName: 'Dumbbell',
          xp: 50,
          completed: false,
        },
        {
          id: '2',
          name: 'Read 30 Minutes',
          iconName: 'Book',
          xp: 30,
          completed: false,
        },
        {
          id: '3',
          name: 'Eat Healthy Meal',
          iconName: 'Apple',
          xp: 25,
          completed: false,
        },
        {
          id: '4',
          name: 'Sleep 8 Hours',
          iconName: 'Bed',
          xp: 40,
          completed: false,
        },
        {
          id: '5',
          name: 'Drink 2L Water',
          iconName: 'Droplets',
          xp: 20,
          completed: false,
        },
        {
          id: '6',
          name: 'Meditate 10 Min',
          iconName: 'Brain',
          xp: 35,
          completed: false,
        },
      ];

      // Add default habits to store
      defaultHabits.forEach(habit => {
        addHabit(habit);
      });
    }
  }, [habits.length, addHabit]);

  const handleToggle = (id: string, completed: boolean) => {
    const xpEarned = toggleHabit(id, completed);

    // Update user XP
    updateXP(xpEarned);

    // Update streak based on completion
    const completedHabits = habits.filter(h => h.completed).length + (completed ? 1 : -1);
    const allCompleted = completedHabits === habits.length;
    updateStreakForToday(allCompleted);
  };

  const completedCount = habits.filter(h => h.completed).length;
  const totalXP = habits.filter(h => h.completed).reduce((sum, h) => sum + h.xp, 0);
  return <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Daily Quests
          </h1>
          <p className="text-base text-gray-700 font-semibold">Complete your habits to earn XP</p>
        </header>

        {/* Progress Summary */}
        <section aria-labelledby="progress-heading" className="glass-card rounded-3xl p-6 mb-8">
          <h2 className="sr-only" id="progress-heading">Progress Summary</h2>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-4xl font-bold text-gray-900" aria-live="polite" aria-atomic="true">
                {completedCount}/{habits.length}
              </div>
              <div className="text-base text-gray-700 font-semibold mt-1">Completed Today</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-gold-700" aria-live="polite" aria-atomic="true">
                +{totalXP}
              </div>
              <div className="text-base text-gray-700 font-semibold mt-1">XP Earned</div>
            </div>
          </div>
        </section>

        {/* Habits List */}
        <section aria-labelledby="habits-heading" className="mb-8">
          <h2 className="sr-only" id="habits-heading">Your Daily Habits</h2>
          <div className="space-y-4">
            {habits.map(habit => <HabitItem key={habit.id} {...habit} onToggle={handleToggle} />)}
          </div>
        </section>

        {/* Motivational Message */}
        <aside className="glass-card rounded-3xl p-6 text-center bg-gradient-to-br from-teal-50/80 to-gold-50/60" role="status" aria-live="polite">
          <p className="text-gray-900 font-bold text-lg mb-2">
            {completedCount === habits.length ? "🎉 Perfect day! You're unstoppable!" : completedCount > habits.length / 2 ? '💪 Great progress! Keep it up!' : "🌟 Every step counts. You've got this!"}
          </p>
          <p className="text-base text-gray-700 font-semibold">Your AI coach believes in you</p>
        </aside>
      </div>
    </div>;
}