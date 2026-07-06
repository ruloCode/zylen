/**
 * MyWay (LifeQuest) Badge Component — React Native port.
 * RPG-styled badges for XP, levels, achievements. CSS gradients are rendered
 * with expo-linear-gradient; themed (teal) variants use solid theme colors.
 */

import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/utils';

type BadgeVariant = 'xp' | 'level' | 'achievement' | 'streak' | 'coin';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  withGlow?: boolean;
  withFloat?: boolean;
}

/** Fixed gradient stops per variant (level is themed → solid via className). */
const GRADIENTS: Record<BadgeVariant, [string, string, ...string[]] | null> = {
  xp: ['#F29C06', '#D68500'],
  level: null,
  achievement: ['#E18409', '#F9A410', '#F0B429'],
  streak: ['#F7C948', '#F0B429', '#F56565'],
  coin: ['#FAB62E', '#E18409', '#994B0F'],
};

const CONTAINER_VARIANTS: Record<BadgeVariant, string> = {
  xp: 'border-[#FFBF3F]/80',
  level: 'bg-teal-500 border-teal-300/60',
  achievement: 'border-gold-400/80',
  streak: 'border-warning-300/60',
  coin: 'border-gold-300/70',
};

const TEXT_VARIANTS: Record<BadgeVariant, string> = {
  xp: 'text-[#1A0F00]',
  level: 'text-white',
  achievement: 'text-black',
  streak: 'text-white',
  coin: 'text-black',
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'h-6 min-w-[24px] px-2',
  md: 'h-8 min-w-[32px] px-3',
  lg: 'h-12 min-w-[48px] px-4',
};

const TEXT_SIZES: Record<BadgeSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const GLOW_STYLE: ViewStyle = {
  shadowColor: '#F29C06',
  shadowOpacity: 0.6,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 6,
};

export function Badge({
  children,
  variant = 'xp',
  size = 'md',
  className = '',
  withGlow = false,
  withFloat: _withFloat = false,
}: BadgeProps) {
  const gradient = GRADIENTS[variant];
  const textClassName = cn('font-display font-bold', TEXT_SIZES[size], TEXT_VARIANTS[variant]);

  return (
    <View
      className={cn(
        'flex-row items-center justify-center self-start overflow-hidden rounded-full border-2',
        CONTAINER_VARIANTS[variant],
        SIZES[size],
        className
      )}
      style={withGlow ? GLOW_STYLE : undefined}
    >
      {gradient && (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text className={textClassName}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

/**
 * XP Badge with +XP format
 */
interface XPBadgeProps {
  xp: number;
  size?: BadgeSize;
  className?: string;
  showPlus?: boolean;
}

export function XPBadge({ xp, size = 'md', className = '', showPlus = true }: XPBadgeProps) {
  return (
    <Badge variant="xp" size={size} className={className} withGlow>
      {`${showPlus ? '+' : ''}${xp} XP`}
    </Badge>
  );
}

/**
 * Coin Badge for shop points
 */
interface CoinBadgeProps {
  coins: number;
  size?: BadgeSize;
  className?: string;
}

export function CoinBadge({ coins, size = 'md', className = '' }: CoinBadgeProps) {
  return (
    <Badge variant="coin" size={size} className={className}>
      {coins.toLocaleString()}
    </Badge>
  );
}

/**
 * Achievement Badge with icon
 */
interface AchievementBadgeProps {
  children: React.ReactNode;
  unlocked?: boolean;
  size?: BadgeSize;
  className?: string;
}

export function AchievementBadge({
  children,
  unlocked = false,
  size = 'lg',
  className = '',
}: AchievementBadgeProps) {
  return (
    <Badge
      variant="achievement"
      size={size}
      className={cn(!unlocked && 'opacity-40', className)}
      withGlow={unlocked}
      withFloat={unlocked}
    >
      {children}
    </Badge>
  );
}

export default Badge;
