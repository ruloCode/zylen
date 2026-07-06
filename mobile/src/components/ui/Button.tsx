/**
 * Zylen Button Component — React Native port.
 * Theme-driven buttons (primary/secondary/ghost/danger) with loading state.
 * Same props/API as the web version; `type` and aria props map to a11y props.
 */

import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { cn } from '@/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  danger: 'bg-destructive',
  ghost: 'bg-transparent border-2 border-[hsl(var(--glass-border)/0.2)]',
};

const TEXT_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  danger: 'text-destructive-foreground',
  ghost: 'text-foreground',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2.5 min-h-[44px]',
  md: 'px-6 py-3 min-h-[48px]',
  lg: 'px-8 py-3.5 min-h-[52px]',
};

const TEXT_SIZES: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const SPINNER_COLORS: Record<ButtonVariant, string> = {
  primary: '#FFFFFF',
  secondary: '#FFFFFF',
  danger: '#FFFFFF',
  ghost: '#E5E7EB',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
  disabled = false,
  isLoading = false,
  type: _type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const textClassName = cn('font-semibold', TEXT_SIZES[size], TEXT_VARIANTS[variant]);

  return (
    <Pressable
      onPress={onClick}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={ariaLabel}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-xl active:scale-95',
        VARIANTS[variant],
        SIZES[size],
        isDisabled && 'opacity-50',
        className
      )}
    >
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={SPINNER_COLORS[variant]}
          accessibilityElementsHidden
        />
      )}
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text className={textClassName}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export default Button;
