import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input value */
  value: string | number;
  /** Change handler */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Input type */
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url' | 'search';
  /** Placeholder text */
  placeholder?: string;
  /** Error message to display */
  error?: string;
  /** Whether field has been touched (for validation) */
  touched?: boolean;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Whether input is required */
  required?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
  /** ID for accessibility */
  id?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ARIA described by for accessibility */
  'aria-describedby'?: string;
}

/**
 * Input atom - Generic text input with consistent styling and validation
 *
 * @example
 * ```tsx
 * <Input
 *   value={name}
 *   onChange={(e) => setName(e.target.value)}
 *   placeholder="Enter name"
 *   error="Name is required"
 *   touched={true}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      value,
      onChange,
      type = 'text',
      placeholder,
      error,
      touched = false,
      disabled = false,
      required = false,
      size = 'md',
      className,
      id,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const hasError = touched && !!error;

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3',
      lg: 'px-5 py-4 text-lg',
    };

    return (
      <input
        ref={ref}
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={cn(
          // Base styles
          'w-full rounded-xl border-2 transition-all duration-200',
          'text-white placeholder:text-white/40',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',

          // Size
          sizeClasses[size],

          // State styles
          hasError
            ? 'border-red-500 bg-red-500/10 focus:ring-red-500'
            : 'border-white/20 bg-white/5 hover:border-teal-400',

          // Disabled state
          disabled && 'opacity-50 cursor-not-allowed hover:border-white/20',

          // Custom classes
          className
        )}
        aria-invalid={hasError}
        aria-describedby={hasError && id ? `${id}-error` : rest['aria-describedby']}
        {...rest}
      />
    );
  }
);

Input.displayName = 'Input';
