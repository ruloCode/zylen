import React, { useState } from 'react';
import { Dumbbell, Book, Apple, Bed, Droplets, Brain } from 'lucide-react';
import { HabitItem } from '../components/HabitItem';
export function HabitLog() {
  const [habits, setHabits] = useState([{
    id: '1',
    name: 'Morning Workout',
    icon: <Dumbbell size={24} />,
    xp: 50,
    completed: false
  }, {
    id: '2',
    name: 'Read 30 Minutes',
    icon: <Book size={24} />,
    xp: 30,
    completed: false
  }, {
    id: '3',
    name: 'Eat Healthy Meal',
    icon: <Apple size={24} />,
    xp: 25,
    completed: false
  }, {
    id: '4',
    name: 'Sleep 8 Hours',
    icon: <Bed size={24} />,
    xp: 40,
    completed: false
  }, {
    id: '5',
    name: 'Drink 2L Water',
    icon: <Droplets size={24} />,
    xp: 20,
    completed: false
  }, {
    id: '6',
    name: 'Meditate 10 Min',
    icon: <Brain size={24} />,
    xp: 35,
    completed: false
  }]);
  const handleToggle = (id: string, completed: boolean) => {
    setHabits(habits.map(h => h.id === id ? {
      ...h,
      completed
    } : h));
  };
  const completedCount = habits.filter(h => h.completed).length;
  const totalXP = habits.filter(h => h.completed).reduce((sum, h) => sum + h.xp, 0);
  return <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Daily Quests
          </h1>
          <p className="text-gray-600">Complete your habits to earn XP</p>
        </div>

        {/* Progress Summary */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-3xl font-bold text-gray-800">
                {completedCount}/{habits.length}
              </div>
              <div className="text-sm text-gray-600">Completed Today</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-quest-gold">
                +{totalXP}
              </div>
              <div className="text-sm text-gray-600">XP Earned</div>
            </div>
          </div>
        </div>

        {/* Habits List */}
        <div className="space-y-3 mb-6">
          {habits.map(habit => <HabitItem key={habit.id} {...habit} onToggle={handleToggle} />)}
        </div>

        {/* Motivational Message */}
        <div className="glass-card rounded-3xl p-6 text-center bg-gradient-to-br from-quest-blue/10 to-quest-purple/10">
          <p className="text-gray-800 font-semibold mb-2">
            {completedCount === habits.length ? "🎉 Perfect day! You're unstoppable!" : completedCount > habits.length / 2 ? '💪 Great progress! Keep it up!' : "🌟 Every step counts. You've got this!"}
          </p>
          <p className="text-sm text-gray-600">Your AI coach believes in you</p>
        </div>
      </div>
    </div>;
}