/**
 * MyWay (LifeQuest) ProgressBar Component — React Native port.
 * Nested Views with a %-width LinearGradient fill. The CSS shimmer keyframes
 * are dropped (decorative); the end-of-progress highlight is kept.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { cn } from '@/utils';

type ProgressVariant = 'gold' | 'teal' | 'success' | 'fire';
type ProgressSize = 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  current: number;
  max: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  size?: ProgressSize;
  className?: string;
  withGlow?: boolean;
  withShimmer?: boolean;
}

const HEIGHTS: Record<ProgressSize, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const LABEL_SIZES: Record<ProgressSize, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

// Fixed gradient stops mirroring the web CSS gradients
const GRADIENTS: Record<ProgressVariant, [string, string, ...string[]]> = {
  // Warm gold - DOFUS orange (orange-400 → 500 → 600)
  gold: ['#FFAD33', '#FF9D0A', '#F79503'],
  // Teal - secondary progress (cyan-400 → 500 → 600)
  teal: ['#3FD3E4', '#3CC4D3', '#31B5C4'],
  // Success jade - completed habits (success-400 → 500 → 600)
  success: ['#66CB8F', '#3FBE73', '#33A05F'],
  // Fire gradient - streaks (warning-400 → 500 → danger-400)
  fire: ['#F7C948', '#F0B429', '#F56565'],
};

const GLOW_COLORS: Record<ProgressVariant, string> = {
  gold: 'rgba(242,156,6,0.6)',
  teal: 'rgba(50,200,220,0.6)',
  success: 'rgba(63,190,115,0.6)',
  fire: 'rgba(255,193,7,0.6)',
};

export function ProgressBar({
  current,
  max,
  variant = 'gold',
  showLabel = true,
  size = 'md',
  className = '',
  withGlow = true,
  withShimmer: _withShimmer = true,
}: ProgressBarProps) {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <View className={cn('w-full', className)}>
      {/* Progress bar container */}
      <View
        className={cn(
          'w-full overflow-hidden rounded-full border border-white/10 bg-charcoal-500/30',
          HEIGHTS[size]
        )}
      >
        {/* Progress fill */}
        <View
          className="h-full overflow-hidden rounded-full"
          style={[
            { width: `${percentage}%` },
            withGlow && percentage > 0
              ? {
                  shadowColor: GLOW_COLORS[variant],
                  shadowOpacity: 1,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 0 },
                }
              : null,
          ]}
        >
          <LinearGradient
            colors={GRADIENTS[variant]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Highlight at the end of progress */}
          {percentage > 5 && (
            <View className="absolute bottom-0 right-0 top-0 w-2 bg-white/30" />
          )}
        </View>
      </View>

      {/* XP labels */}
      {showLabel && (
        <View className="mt-1.5 flex-row justify-between">
          <Text className={cn('font-semibold text-white', LABEL_SIZES[size])}>
            {current.toLocaleString()} XP
          </Text>
          <Text className={cn('font-semibold text-white/70', LABEL_SIZES[size])}>
            {max.toLocaleString()} XP
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Circular Progress Ring (for levels, achievements)
 */
interface CircularProgressProps {
  current: number;
  max: number;
  size?: number;
  variant?: 'gold' | 'teal' | 'success' | 'fire' | 'xp';
  strokeWidth?: number;
  children?: React.ReactNode;
  className?: string;
}

export function CircularProgress({
  current,
  max,
  size = 120,
  variant = 'gold',
  strokeWidth = 8,
  children,
  className = '',
}: CircularProgressProps) {
  const percentage = Math.min((current / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorVariants: Record<'gold' | 'teal' | 'success' | 'fire', string> = {
    gold: '#FFC857',
    teal: '#2AB7A9',
    success: '#42B381',
    fire: '#FFC107',
  };

  // 'xp' uses an SVG linear gradient (blue → purple) instead of a flat color.
  // Unique id avoids collisions when several rings render on the same screen.
  const gradientId = React.useId();
  const isGradient = variant === 'xp';
  const strokeColor = isGradient ? `url(#${gradientId})` : colorVariants[variant];

  return (
    <View className={cn('items-center justify-center', className)}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        {isGradient && (
          <Defs>
            <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#6EC1E4" />
              <Stop offset="100%" stopColor="#A855F7" />
            </SvgLinearGradient>
          </Defs>
        )}

        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F7EEDB"
          strokeWidth={strokeWidth}
          opacity={0.18}
        />

        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>

      {/* Center content */}
      {children && (
        <View className="absolute inset-0 items-center justify-center">{children}</View>
      )}
    </View>
  );
}

export default ProgressBar;
