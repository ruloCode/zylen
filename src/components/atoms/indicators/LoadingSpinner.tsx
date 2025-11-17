import React from 'react';
import { Loader2 } from 'lucide-react';
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

/**
 * LoadingSpinner atom - Consistent loading indicator across the app
 *
 * Consolidates all Loader2 usage patterns into a single reusable component
 *
 * @example
 * ```tsx
 * // Simple spinner
 * <LoadingSpinner size="md" variant="teal" />
 *
 * // Centered with label
 * <LoadingSpinner size="lg" variant="teal" center label="Loading..." />
 *
 * // In a button
 * <button disabled>
 *   <LoadingSpinner size="sm" className="mr-2" />
 *   Loading...
 * </button>
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  variant = 'teal',
  className,
  center = false,
  label,
}: LoadingSpinnerProps) {
  // Size classes
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  // Variant classes
  const variantClasses = {
    teal: 'text-teal-500',
    gold: 'text-[rgb(242,156,6)]',
    white: 'text-white',
    green: 'text-[rgb(155,215,50)]',
  };

  const spinner = (
    <Loader2
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        'animate-spin',
        className
      )}
      aria-hidden="true"
    />
  );

  if (center || label) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-3',
          center && 'py-8'
        )}
        role="status"
        aria-label={label || 'Loading'}
      >
        {spinner}
        {label && (
          <span className={cn(
            'font-medium',
            variantClasses[variant]
          )}>
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <span role="status" aria-label="Loading">
      {spinner}
    </span>
  );
}
