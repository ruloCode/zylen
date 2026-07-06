/**
 * TextArea atom — React Native port.
 * Multiline TextInput with the web API preserved (`onChange` gets a
 * `{ target: { value } }` event) plus optional character counter.
 */

import React, { forwardRef } from 'react';
import { Text, TextInput, View } from 'react-native';
import { cn } from '@/utils/cn';
import type { InputChangeEvent } from './Input';

export interface TextAreaProps {
  /** TextArea value */
  value: string;
  /** Change handler (web-style event: use e.target.value) */
  onChange?: (e: InputChangeEvent) => void;
  /** Native-style change handler */
  onChangeText?: (text: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Error message to display */
  error?: string;
  /** Whether field has been touched (for validation) */
  touched?: boolean;
  /** Whether textarea is disabled */
  disabled?: boolean;
  /** Whether textarea is required (kept for API parity) */
  required?: boolean;
  /** Number of rows (maps to a minimum height) */
  rows?: number;
  /** Maximum character length */
  maxLength?: number;
  /** Show character counter */
  showCounter?: boolean;
  /** Allow resize (no-op on native, kept for API parity) */
  resize?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
  /** ID for accessibility (kept for API parity) */
  id?: string;
  /** Blur handler */
  onBlur?: () => void;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ARIA described by for accessibility (kept for API parity) */
  'aria-describedby'?: string;
}

const SIZE_CLASSES: Record<NonNullable<TextAreaProps['size']>, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
};

export const TextArea = forwardRef<TextInput, TextAreaProps>(
  (
    {
      value,
      onChange,
      onChangeText,
      placeholder,
      error,
      touched = false,
      disabled = false,
      required: _required = false,
      rows = 3,
      maxLength,
      showCounter = false,
      resize: _resize = false,
      size = 'md',
      className,
      id: _id,
      onBlur,
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    const hasError = touched && !!error;
    const characterCount = typeof value === 'string' ? value.length : 0;
    const isNearLimit = maxLength && characterCount >= maxLength * 0.9;

    const handleChangeText = (text: string) => {
      onChangeText?.(text);
      onChange?.({ target: { value: text } });
    };

    return (
      <View className="w-full">
        <TextInput
          ref={ref}
          value={value}
          onChangeText={handleChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.4)"
          editable={!disabled}
          maxLength={maxLength}
          multiline
          numberOfLines={rows}
          textAlignVertical="top"
          style={{ minHeight: rows * 24 }}
          accessibilityLabel={ariaLabel}
          accessibilityState={{ disabled }}
          className={cn(
            // Base styles
            'w-full rounded-xl border-2 text-white',

            // Size
            SIZE_CLASSES[size],

            // State styles
            hasError ? 'border-red-500 bg-red-500/10' : 'border-white/20 bg-white/5',

            // Disabled state
            disabled && 'opacity-50',

            // Custom classes
            className
          )}
        />

        {/* Character Counter */}
        {showCounter && maxLength && (
          <View className="mt-1 flex-row items-center justify-end">
            <Text
              className={cn(
                'text-xs font-medium',
                isNearLimit ? 'text-warning-400' : 'text-white/60',
                characterCount > maxLength && 'text-red-500'
              )}
            >
              {characterCount}/{maxLength}
            </Text>
          </View>
        )}
      </View>
    );
  }
);

TextArea.displayName = 'TextArea';
