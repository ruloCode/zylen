/**
 * MyWay (LifeQuest) Badge Component
 * RPG-styled badges for XP, levels, achievements with isometric shadows
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'xp' | 'level' | 'achievement' | 'streak' | 'coin';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  withGlow?: boolean;
  withFloat?: boolean;
}

export function Badge({
  children,
  variant = 'xp',
  size = 'md',
  className = '',
  withGlow = false,
  withFloat = false
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center justify-center font-display font-bold rounded-full transition-all duration-200';

  const variants = {
    // XP badge - Golden with shimmer
    xp: `
      bg-gradient-to-br from-[#F29C06] to-[#D68500]
      text-[#1A0F00]
      border-2 border-[#FFBF3F]/80
      shadow-[0_2px_8px_rgba(242,156,6,0.6)]
    `,

    // Level badge - Teal with metallic feel
    level: `
      bg-gradient-to-br from-teal-400 to-teal-600
      text-white
      border-2 border-teal-300/60
      shadow-isometric
    `,

    // Achievement badge - Gold with special glow
    achievement: `
      bg-gradient-to-br from-gold-600 via-gold-500 to-warning-500
      text-black
      border-2 border-gold-400/80
      shadow-glow-gold
    `,

    // Streak badge - Fire gradient
    streak: `
      bg-gradient-to-br from-warning-400 via-warning-500 to-danger-400
      text-white
      border-2 border-warning-300/60
      shadow-soft-md
    `,

    // Coin badge - Shiny gold coin
    coin: `
      bg-gradient-to-br from-gold-400 via-gold-600 to-gold-800
      text-black
      border-2 border-gold-300/70
      shadow-isometric
    `
  };

  const sizes = {
    sm: 'h-6 min-w-[24px] px-2 text-xs',
    md: 'h-8 min-w-[32px] px-3 text-sm',
    lg: 'h-12 min-w-[48px] px-4 text-base'
  };

  const glowClass = withGlow ? 'glow-gold animate-glow-pulse' : '';
  const floatClass = withFloat ? 'float-gentle' : '';

  return (
    <span
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        glowClass,
        floatClass,
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * XP Badge with +XP format
 */
interface XPBadgeProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showPlus?: boolean;
}

export function XPBadge({ xp, size = 'md', className = '', showPlus = true }: XPBadgeProps) {
  return (
    <Badge variant="xp" size={size} className={cn('animate-glow-pulse', className)} withGlow>
      <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-extrabold">
        {showPlus && '+'}{xp} XP
      </span>
    </Badge>
  );
}

/**
 * Coin Badge for shop points
 */
interface CoinBadgeProps {
  coins: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CoinBadge({ coins, size = 'md', className = '' }: CoinBadgeProps) {
  return (
    <Badge variant="coin" size={size} className={className}>
      <span className="drop-shadow-sm">
        {coins.toLocaleString()}
      </span>
    </Badge>
  );
}

/**
 * Achievement Badge with icon
 */
interface AchievementBadgeProps {
  children: React.ReactNode;
  unlocked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AchievementBadge({
  children,
  unlocked = false,
  size = 'lg',
  className = ''
}: AchievementBadgeProps) {
  return (
    <Badge
      variant="achievement"
      size={size}
      className={cn(!unlocked && 'opacity-40 grayscale', className)}
      withGlow={unlocked}
      withFloat={unlocked}
    >
      {children}
    </Badge>
  );
}

export default Badge;
