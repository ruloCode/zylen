/**
 * MyWay (LifeQuest) StreakDisplay Component
 * Simple, clean streak display inspired by macOS design
 */

import React from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakDisplayProps {
  streak: number; // Total consecutive days
  weeklyStreak: number; // Days completed this week (0-7)
  lastSevenDays: boolean[]; // Array of last 7 days completion status [oldest...newest]
  size?: 'sm' | 'md' | 'lg';
}

// Get day labels (Mon-Sun) for the calendar
function getDayLabels(): string[] {
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayIndex = today === 0 ? 6 : today - 1; // Adjust for Monday start

  // Rotate array so current day is at the end
  const rotated = [...days.slice(mondayIndex + 1), ...days.slice(0, mondayIndex + 1)];
  return rotated.slice(-7); // Last 7 days ending today
}

export function StreakDisplay({
  streak,
  weeklyStreak,
  lastSevenDays,
  size = 'md'
}: StreakDisplayProps) {
  const dayLabels = getDayLabels();

  return (
    <div className="w-full p-6">
      {/* Main Streak Number */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <Flame size={32} className="text-orange-500" />
        <div className="text-5xl font-bold text-gray-900">
          {streak}
        </div>
       
      </div>
      <div className="text-center text-gray-600">
          Keep it up!
        </div>

     
    </div>
  );
}

export default StreakDisplay;
