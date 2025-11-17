import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  /** Option value */
  value: string;
  /** Option label (displayed to user) */
  label: string;
  /** Whether option is disabled */
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Select value */
  value: string;
  /** Change handler */
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Options to display */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Error message to display */
  error?: string;
  /** Whether field has been touched (for validation) */
  touched?: boolean;
  /** Whether select is disabled */
  disabled?: boolean;
  /** Whether select is required */
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
 * Select atom - Generic select/dropdown with consistent styling and validation
 *
 * @example
 * ```tsx
 * <Select
 *   value={selectedArea}
 *   onChange={(e) => setSelectedArea(e.target.value)}
 *   options={[
 *     { value: '', label: 'Select an area' },
 *     { value: 'health', label: 'Health' },
 *     { value: 'finance', label: 'Finance' },
 *   ]}
 *   error="Area is required"
 *   touched={true}
 * />
 * ```
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      value,
      onChange,
      options,
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
      sm: 'px-3 py-2 pr-8 text-sm',
      md: 'px-4 py-3 pr-10',
      lg: 'px-5 py-4 pr-12 text-lg',
    };

    const iconSizeClasses = {
      sm: 'w-4 h-4 right-2',
      md: 'w-5 h-5 right-3',
      lg: 'w-6 h-6 right-4',
    };

    return (
      <div className="relative w-full">
        <select
          ref={ref}
          id={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={cn(
            // Base styles
            'w-full rounded-xl border-2 transition-all duration-200 appearance-none',
            'text-white',
            'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
            'cursor-pointer',

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
        >
          {/* Placeholder option */}
          {placeholder && (
            <option value="" disabled className="text-white/40">
              {placeholder}
            </option>
          )}

          {/* Options */}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="bg-charcoal-500 text-white"
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Chevron Icon */}
        <ChevronDown
          className={cn(
            'absolute top-1/2 -translate-y-1/2 pointer-events-none transition-colors',
            iconSizeClasses[size],
            disabled ? 'text-white/30' : 'text-white/60'
          )}
          aria-hidden="true"
        />
      </div>
    );
  }
);

Select.displayName = 'Select';
