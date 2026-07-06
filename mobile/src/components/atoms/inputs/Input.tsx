/**
 * Input atom — React Native port.
 * TextInput that preserves the web API: `onChange` receives a synthetic
 * `{ target: { value } }` event so web call sites (`e.target.value`) work
 * unchanged. `onChangeText` is also supported for native-style call sites.
 */

import React, { forwardRef } from 'react';
import { TextInput, type KeyboardTypeOptions } from 'react-native';
import { cn } from '@/utils/cn';

/** Minimal shape of the web ChangeEvent that ported code relies on. */
export interface InputChangeEvent {
  target: { value: string };
}

export interface InputProps {
  /** Input value */
  value: string | number;
  /** Change handler (web-style event: use e.target.value) */
  onChange?: (e: InputChangeEvent) => void;
  /** Native-style change handler */
  onChangeText?: (text: string) => void;
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
  /** Whether input is required (a11y only on native) */
  required?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
  /** ID for accessibility (kept for API parity) */
  id?: string;
  /** Blur handler */
  onBlur?: () => void;
  /** Maximum character length */
  maxLength?: number;
  /** Autofocus on mount */
  autoFocus?: boolean;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ARIA described by for accessibility (kept for API parity) */
  'aria-describedby'?: string;
}

const SIZE_CLASSES: Record<NonNullable<InputProps['size']>, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
};

const KEYBOARD_TYPES: Partial<Record<NonNullable<InputProps['type']>, KeyboardTypeOptions>> = {
  number: 'numeric',
  email: 'email-address',
  tel: 'phone-pad',
  url: 'url',
};

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      value,
      onChange,
      onChangeText,
      type = 'text',
      placeholder,
      error,
      touched = false,
      disabled = false,
      required = false,
      size = 'md',
      className,
      id: _id,
      onBlur,
      maxLength,
      autoFocus,
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    const hasError = touched && !!error;

    const handleChangeText = (text: string) => {
      onChangeText?.(text);
      onChange?.({ target: { value: text } });
    };

    return (
      <TextInput
        ref={ref}
        value={String(value ?? '')}
        onChangeText={handleChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.4)"
        editable={!disabled}
        maxLength={maxLength}
        autoFocus={autoFocus}
        keyboardType={KEYBOARD_TYPES[type]}
        secureTextEntry={type === 'password'}
        autoCapitalize={type === 'email' || type === 'url' || type === 'password' ? 'none' : undefined}
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
    );
  }
);

Input.displayName = 'Input';
