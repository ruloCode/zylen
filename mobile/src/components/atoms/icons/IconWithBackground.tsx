/**
 * IconWithBackground atom — React Native port.
 * Icon inside a tinted container. Web gradients become solid theme-aware
 * backgrounds; icon colors are concrete values (lucide native uses `color`).
 */

import React from 'react';
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
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
  /** Whether to show hover effects (no-op on native, kept for API parity) */
  hoverable?: boolean;
}

type Variant = NonNullable<IconWithBackgroundProps['variant']>;
type Size = NonNullable<IconWithBackgroundProps['size']>;

const CONTAINER_SIZE_CLASSES: Record<Size, string> = {
  sm: 'p-2',
  md: 'p-2.5',
  lg: 'p-3',
  xl: 'p-4',
};

const DEFAULT_ICON_SIZES: Record<Size, number> = {
  sm: 16,
  md: 20,
  lg: 28,
  xl: 36,
};

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-teal-500',
  success: 'bg-teal-500',
  gold: 'bg-[rgb(242,156,6)]',
  teal: 'bg-teal-500',
  'gold-subtle': 'bg-gold-500/30',
  'teal-subtle': 'bg-teal-500/20',
};

const ICON_COLORS: Record<Variant, string> = {
  primary: '#FFFFFF',
  success: '#FFFFFF',
  gold: '#FFFFFF',
  teal: '#FFFFFF',
  'gold-subtle': 'rgb(242,156,6)',
  'teal-subtle': '#66D6C7',
};

export function IconWithBackground({
  icon: Icon,
  variant = 'teal',
  size = 'md',
  iconSize,
  shape = 'rounded-xl',
  className,
  hoverable: _hoverable = false,
}: IconWithBackgroundProps) {
  return (
    <View
      className={cn(
        // Base styles
        'items-center justify-center self-start',

        // Shape
        shape === 'circle' ? 'rounded-full' : shape,

        // Size
        CONTAINER_SIZE_CLASSES[size],

        // Variant
        VARIANT_CLASSES[variant],

        // Custom classes
        className
      )}
    >
      <Icon size={iconSize || DEFAULT_ICON_SIZES[size]} color={ICON_COLORS[variant]} />
    </View>
  );
}
