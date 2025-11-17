import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface IconWithBackgroundProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Visual variant */
  variant?: 'primary' | 'success' | 'gold' | 'teal' | 'gold-subtle' | 'teal-subtle';
  /** Size of the icon container */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Icon size (overrides default size from container size) */
  iconSize?: number;
  /** Shape of the background */
  shape?: 'rounded' | 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'circle';
  /** Additional class names */
  className?: string;
  /** Whether to show hover effects */
  hoverable?: boolean;
}

/**
 * IconWithBackground atom - Icon with gradient background container
 *
 * **CRITICAL COMPONENT** - Consolidates 10+ duplicated patterns across the app
 *
 * Used in: HabitItem, ShopItem, LifeAreaCard, ProfileHeader, and more
 *
 * @example
 * ```tsx
 * // Habit item icon (completed state)
 * <IconWithBackground
 *   icon={CheckCircle}
 *   variant="success"
 *   size="md"
 * />
 *
 * // Habit item icon (not completed)
 * <IconWithBackground
 *   icon={Target}
 *   variant="gold-subtle"
 *   size="md"
 * />
 *
 * // Shop item icon with hover
 * <IconWithBackground
 *   icon={Gift}
 *   variant="gold"
 *   size="lg"
 *   hoverable
 * />
 * ```
 */
export function IconWithBackground({
  icon: Icon,
  variant = 'teal',
  size = 'md',
  iconSize,
  shape = 'rounded-xl',
  className,
  hoverable = false,
}: IconWithBackgroundProps) {
  // Container size classes
  const containerSizeClasses = {
    sm: 'p-2',
    md: 'p-2.5 sm:p-3',
    lg: 'p-3 sm:p-4',
    xl: 'p-4 sm:p-5',
  };

  // Icon size classes (default based on container size if not specified)
  const defaultIconSizes = {
    sm: 16,
    md: 20,
    lg: 28,
    xl: 36,
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-glow-teal',
    success: 'bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-glow-teal',
    gold: 'bg-gradient-to-br from-[rgb(242,156,6)] to-[rgb(242,156,6)]/80 text-white shadow-glow-gold',
    teal: 'bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-glow-teal',
    'gold-subtle': 'bg-gradient-to-br from-gold-500/30 to-gold-600/30 text-[rgb(242,156,6)] shadow-soft',
    'teal-subtle': 'bg-gradient-to-br from-teal-500/20 to-teal-600/20 text-teal-400 shadow-soft',
  };

  return (
    <div
      className={cn(
        // Base styles
        'transition-all duration-300 flex-shrink-0 inline-flex items-center justify-center',

        // Shape
        shape,

        // Size
        containerSizeClasses[size],

        // Variant
        variantClasses[variant],

        // Hover effects
        hoverable && 'hover:scale-110 hover:shadow-glow-gold',

        // Custom classes
        className
      )}
    >
      <Icon
        size={iconSize || defaultIconSizes[size]}
        className={cn(
          // Responsive sizing for md size (used in HabitItem)
          size === 'md' && !iconSize && 'sm:w-6 sm:h-6',
          // Drop shadow for depth
          'drop-shadow-md'
        )}
        aria-hidden="true"
      />
    </div>
  );
}
