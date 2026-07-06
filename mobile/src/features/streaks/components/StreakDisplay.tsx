/**
 * MyWay (LifeQuest) StreakDisplay Component — React Native port.
 * Simple, clean streak display inspired by macOS design.
 * Same props/API as the web version (weeklyStreak/lastSevenDays/size are
 * part of the contract even though the current design only renders the
 * total streak + motivational copy, exactly like the web).
 */

import React from 'react';
import { Text, View } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';

interface StreakDisplayProps {
  streak: number; // Total consecutive days
  weeklyStreak: number; // Days completed this week (0-7)
  lastSevenDays: boolean[]; // Array of last 7 days completion status [oldest...newest]
  size?: 'sm' | 'md' | 'lg';
}

export function StreakDisplay({
  streak,
  weeklyStreak: _weeklyStreak,
  lastSevenDays: _lastSevenDays,
  size: _size = 'md',
}: StreakDisplayProps) {
  const { t } = useLocale();

  return (
    <View className="w-full p-6">
      {/* Main Streak Number */}
      <View className="mb-6 flex-row items-center justify-center gap-3">
        <Flame size={32} color="rgb(242,156,6)" />
        <Text className="text-5xl font-bold text-white">{streak}</Text>
      </View>
      <Text className="text-center text-white">{t('rootHabit.keepGoing')}</Text>
    </View>
  );
}

export default StreakDisplay;
