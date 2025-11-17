import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
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
}

/**
 * IconButton atom - Generic button with icon only
 *
 * Used for actions like close, delete, edit, etc.
 *
 * @example
 * ```tsx
 * <IconButton
 *   icon={X}
 *   onClick={handleClose}
 *   aria-label="Close modal"
 *   variant="ghost"
 * />
 *
 * <IconButton
 *   icon={Trash2}
 *   onClick={handleDelete}
 *   aria-label="Delete habit"
 *   variant="danger"
 *   size="sm"
 * />
 * ```
 */
export function IconButton({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  isActive = false,
  disabled = false,
  onClick,
  className,
  type = 'button',
  'aria-label': ariaLabel,
  ...rest
}: IconButtonProps) {
  // Size classes
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Variant classes
  const variantClasses = {
    primary: cn(
      'bg-gradient-to-br from-teal-400 to-teal-600 text-white',
      'hover:from-teal-500 hover:to-teal-700',
      'focus:ring-teal-500',
      'shadow-glow-teal',
      isActive && 'ring-2 ring-teal-400 ring-offset-2 ring-offset-charcoal-500'
    ),
    secondary: cn(
      'bg-white/10 text-white border border-white/20',
      'hover:bg-white/20 hover:border-white/30',
      'focus:ring-white/50',
      isActive && 'bg-white/20 border-white/40'
    ),
    ghost: cn(
      'text-white/80',
      'hover:bg-white/10',
      'focus:ring-white/50',
      isActive && 'bg-white/15 text-white'
    ),
    danger: cn(
      'text-red-400',
      'hover:bg-red-500/10 hover:text-red-300',
      'focus:ring-red-500',
      isActive && 'bg-red-500/15 text-red-300'
    ),
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        // Base styles
        'rounded-xl transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-charcoal-500',
        'inline-flex items-center justify-center',

        // Size
        sizeClasses[size],

        // Variant
        variantClasses[variant],

        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',

        // Custom classes
        className
      )}
      {...rest}
    >
      <Icon className={cn(iconSizeClasses[size])} aria-hidden="true" />
    </button>
  );
}
