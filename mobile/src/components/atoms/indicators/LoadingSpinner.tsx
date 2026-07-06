/**
 * LoadingSpinner atom — React Native port.
 * ActivityIndicator wrapped to preserve the web component's props
 * (size, variant, className, center, label).
 */

import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { cn } from '@/utils/cn';

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Color variant */
  variant?: 'teal' | 'gold' | 'white' | 'green';
  /** Custom className */
  className?: string;
  /** Whether to center the spinner */
  center?: boolean;
  /** Show with text label */
  label?: string;
}

type SpinnerSize = NonNullable<LoadingSpinnerProps['size']>;
type SpinnerVariant = NonNullable<LoadingSpinnerProps['variant']>;

// ActivityIndicator only guarantees small/large cross-platform
const NATIVE_SIZES: Record<SpinnerSize, 'small' | 'large'> = {
  xs: 'small',
  sm: 'small',
  md: 'large',
  lg: 'large',
  xl: 'large',
};

const VARIANT_COLORS: Record<SpinnerVariant, string> = {
  teal: '#2BD4BD',
  gold: 'rgb(242,156,6)',
  white: '#FFFFFF',
  green: 'rgb(155,215,50)',
};

const LABEL_CLASSES: Record<SpinnerVariant, string> = {
  teal: 'text-teal-500',
  gold: 'text-[rgb(242,156,6)]',
  white: 'text-white',
  green: 'text-[rgb(155,215,50)]',
};

export function LoadingSpinner({
  size = 'md',
  variant = 'teal',
  className,
  center = false,
  label,
}: LoadingSpinnerProps) {
  const spinner = (
    <ActivityIndicator
      size={NATIVE_SIZES[size]}
      color={VARIANT_COLORS[variant]}
      className={className}
    />
  );

  if (center || label) {
    return (
      <View
        className={cn('flex-row items-center justify-center gap-3', center && 'py-8')}
        accessibilityRole="progressbar"
        accessibilityLabel={label || 'Loading'}
      >
        {spinner}
        {label && (
          <Text className={cn('font-medium', LABEL_CLASSES[variant])}>{label}</Text>
        )}
      </View>
    );
  }

  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading">
      {spinner}
    </View>
  );
}
