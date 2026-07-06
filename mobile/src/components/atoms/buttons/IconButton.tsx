/**
 * IconButton atom — React Native port.
 * Icon-only Pressable. Lucide icons take numeric `size` and `color` props on
 * native (no className), so per-variant icon colors are fixed values.
 */

import React from 'react';
import { Pressable } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { cn } from '@/utils/cn';

export interface IconButtonProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether button is active (for navigation buttons) */
  isActive?: boolean;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** ARIA label (required for accessibility) */
  'aria-label': string;
  /** Additional class names */
  className?: string;
  /** Kept for web API compatibility (no-op on native) */
  type?: 'button' | 'submit' | 'reset';
}

type IconButtonVariant = NonNullable<IconButtonProps['variant']>;
type IconButtonSize = NonNullable<IconButtonProps['size']>;

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
};

const ICON_SIZES: Record<IconButtonSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function IconButton({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  isActive = false,
  disabled = false,
  onClick,
  className,
  type: _type = 'button',
  'aria-label': ariaLabel,
}: IconButtonProps) {
  // Variant classes (container)
  const variantClasses: Record<IconButtonVariant, string> = {
    primary: cn('bg-teal-500', isActive && 'border-2 border-teal-300'),
    secondary: cn(
      'bg-white/10 border border-white/20 active:bg-white/20',
      isActive && 'bg-white/20 border-white/40'
    ),
    ghost: cn('active:bg-white/10', isActive && 'bg-white/15'),
    danger: cn('active:bg-red-500/10', isActive && 'bg-red-500/15'),
  };

  // Icon colors per variant (lucide-react-native takes `color`, not className)
  const iconColors: Record<IconButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    ghost: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.8)',
    danger: isActive ? '#FCA5A5' : '#F87171',
  };

  return (
    <Pressable
      onPress={onClick}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={ariaLabel}
      accessibilityState={{ disabled, selected: isActive }}
      className={cn(
        // Base styles
        'items-center justify-center rounded-xl',

        // Size
        SIZE_CLASSES[size],

        // Variant
        variantClasses[variant],

        // Disabled state
        disabled && 'opacity-50',

        // Custom classes
        className
      )}
    >
      <Icon size={ICON_SIZES[size]} color={iconColors[variant]} />
    </Pressable>
  );
}
