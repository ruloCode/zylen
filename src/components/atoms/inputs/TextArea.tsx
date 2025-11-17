import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** TextArea value */
  value: string;
  /** Change handler */
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Error message to display */
  error?: string;
  /** Whether field has been touched (for validation) */
  touched?: boolean;
  /** Whether textarea is disabled */
  disabled?: boolean;
  /** Whether textarea is required */
  required?: boolean;
  /** Number of rows */
  rows?: number;
  /** Maximum character length */
  maxLength?: number;
  /** Show character counter */
  showCounter?: boolean;
  /** Allow resize */
  resize?: boolean;
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
 * TextArea atom - Generic multi-line text input with consistent styling and optional character counter
 *
 * @example
 * ```tsx
 * <TextArea
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   placeholder="Enter description"
 *   rows={4}
 *   maxLength={200}
 *   showCounter
 *   error="Description is required"
 *   touched={true}
 * />
 * ```
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      value,
      onChange,
      placeholder,
      error,
      touched = false,
      disabled = false,
      required = false,
      rows = 3,
      maxLength,
      showCounter = false,
      resize = false,
      size = 'md',
      className,
      id,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const hasError = touched && !!error;
    const characterCount = typeof value === 'string' ? value.length : 0;
    const isNearLimit = maxLength && characterCount >= maxLength * 0.9;

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3',
      lg: 'px-5 py-4 text-lg',
    };

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          id={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            // Base styles
            'w-full rounded-xl border-2 transition-all duration-200',
            'text-white placeholder:text-white/40',
            'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',

            // Size
            sizeClasses[size],

            // Resize behavior
            resize ? 'resize-y' : 'resize-none',

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

        {/* Character Counter */}
        {showCounter && maxLength && (
          <div className="mt-1 flex items-center justify-end">
            <span
              className={cn(
                'text-xs font-medium transition-colors',
                isNearLimit ? 'text-warning' : 'text-white/60',
                characterCount > maxLength && 'text-red-500'
              )}
            >
              {characterCount}/{maxLength}
            </span>
          </div>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
