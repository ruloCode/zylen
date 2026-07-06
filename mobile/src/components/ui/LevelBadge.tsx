/**
 * LevelBadge component — React Native port.
 * Gold gradient pill (expo-linear-gradient) with trophy icon + "LVL n" text.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy } from 'lucide-react-native';
import { cn } from '@/utils';

type LevelBadgeSize = 'sm' | 'md' | 'lg';

interface LevelBadgeProps {
  level: number;
  size?: LevelBadgeSize;
  showIcon?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<LevelBadgeSize, string> = {
  sm: 'px-2 py-0.5',
  md: 'px-3 py-1',
  lg: 'px-4 py-2',
};

const TEXT_SIZES: Record<LevelBadgeSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const ICON_SIZES: Record<LevelBadgeSize, number> = {
  sm: 12,
  md: 16,
  lg: 20,
};

/**
 * LevelBadge component - Displays a user or life area level
 */
export function LevelBadge({
  level,
  size = 'md',
  showIcon = true,
  className,
}: LevelBadgeProps) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-1.5 self-start overflow-hidden rounded-full',
        SIZE_CLASSES[size],
        className
      )}
    >
      {/* gold-400 → gold-500 gradient (web: from-gold-400 to-gold-500) */}
      <LinearGradient
        colors={['#FAB62E', '#F9A410']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {showIcon && <Trophy size={ICON_SIZES[size]} color="#FFFFFF" />}
      <Text className={cn('font-bold text-white', TEXT_SIZES[size])}>LVL {level}</Text>
    </View>
  );
}
