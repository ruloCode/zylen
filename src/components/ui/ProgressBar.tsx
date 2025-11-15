/**
 * MyWay (LifeQuest) ProgressBar Component
 * RPG-styled progress bars with warm glow trails and shimmer effects
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  max: number;
  variant?: 'gold' | 'teal' | 'success' | 'fire';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  withGlow?: boolean;
  withShimmer?: boolean;
}

export function ProgressBar({
  current,
  max,
  variant = 'gold',
  showLabel = true,
  size = 'md',
  className = '',
  withGlow = true,
  withShimmer = true
}: ProgressBarProps) {
  const percentage = Math.min((current / max) * 100, 100);

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const labelSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
  };

  // Fixed gradient variants (no dynamic class generation)
  const gradientVariants = {
    // Warm gold - primary XP color
    gold: 'bg-gradient-to-r from-gold-500 via-gold-600 to-gold-700',

    // Teal - secondary progress
    teal: 'bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600',

    // Success jade - completed habits
    success: 'bg-gradient-to-r from-success-400 via-success-500 to-success-600',

    // Fire gradient - streaks
    fire: 'bg-gradient-to-r from-warning-400 via-warning-500 to-danger-400'
  };

  // Glow effects for each variant
  const glowVariants = {
    gold: 'shadow-glow-gold',
    teal: 'shadow-glow-teal',
    success: 'shadow-glow-success',
    fire: 'shadow-soft-md'
  };

  const glowClass = withGlow && percentage > 0 ? glowVariants[variant] : '';

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar container */}
      <div
        className={cn(
          'w-full bg-parchment-200/50 rounded-full overflow-hidden border border-parchment-300/30',
          heights[size]
        )}
      >
        {/* Progress fill */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out relative',
            gradientVariants[variant],
            glowClass
          )}
          style={{ width: `${percentage}%` }}
        >
          {/* Shimmer effect overlay */}
          {withShimmer && percentage > 0 && (
            <div
              className="absolute inset-0 animate-shimmer-gold opacity-60"
              style={{
                backgroundSize: '200% 100%',
                backgroundImage:
                  'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)'
              }}
            />
          )}

          {/* Highlight at the end of progress */}
          {percentage > 5 && (
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-r from-transparent to-white/40" />
          )}
        </div>
      </div>

      {/* XP labels */}
      {showLabel && (
        <div
          className={cn(
            'flex justify-between mt-1.5 font-body font-semibold text-navy-600',
            labelSizes[size]
          )}
        >
          <span>{current.toLocaleString()} XP</span>
          <span className="text-navy-400">{max.toLocaleString()} XP</span>
        </div>
      )}
    </div>
  );
}

/**
 * Circular Progress Ring (for levels, achievements)
 */
interface CircularProgressProps {
  current: number;
  max: number;
  size?: number;
  variant?: 'gold' | 'teal' | 'success' | 'fire';
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
  className = ''
}: CircularProgressProps) {
  const percentage = Math.min((current / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorVariants = {
    gold: '#FFC857',
    teal: '#2AB7A9',
    success: '#42B381',
    fire: '#FFC107'
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F7EEDB"
          strokeWidth={strokeWidth}
          opacity="0.3"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorVariants[variant]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out drop-shadow-lg"
        />
      </svg>

      {/* Center content */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

export default ProgressBar;
