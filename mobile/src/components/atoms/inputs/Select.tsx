/**
 * Select atom — React Native port.
 * There is no <select> on native: the trigger is a Pressable styled like the
 * web select, and options open in a transparent Modal list. The web API is
 * preserved: `onChange` receives `{ target: { value } }`.
 */

import React, { forwardRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { cn } from '@/utils/cn';
import type { InputChangeEvent } from './Input';

export interface SelectOption {
  /** Option value */
  value: string;
  /** Option label (displayed to user) */
  label: string;
  /** Whether option is disabled */
  disabled?: boolean;
}

export interface SelectProps {
  /** Select value */
  value: string;
  /** Change handler (web-style event: use e.target.value) */
  onChange?: (e: InputChangeEvent) => void;
  /** Native-style change handler */
  onValueChange?: (value: string) => void;
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
  /** Whether select is required (kept for API parity) */
  required?: boolean;
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

const SIZE_CLASSES: Record<NonNullable<SelectProps['size']>, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-5 py-4',
};

const TEXT_SIZE_CLASSES: Record<NonNullable<SelectProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const ICON_SIZES: Record<NonNullable<SelectProps['size']>, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

export const Select = forwardRef<View, SelectProps>(
  (
    {
      value,
      onChange,
      onValueChange,
      options,
      placeholder,
      error,
      touched = false,
      disabled = false,
      required: _required = false,
      size = 'md',
      className,
      id: _id,
      onBlur,
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasError = touched && !!error;

    const selectedOption = options.find((option) => option.value === value);

    const handleSelect = (optionValue: string) => {
      setIsOpen(false);
      onValueChange?.(optionValue);
      onChange?.({ target: { value: optionValue } });
      onBlur?.();
    };

    return (
      <View ref={ref} className="w-full">
        {/* Trigger */}
        <Pressable
          onPress={() => setIsOpen(true)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={ariaLabel || placeholder}
          accessibilityState={{ disabled, expanded: isOpen }}
          className={cn(
            // Base styles
            'w-full flex-row items-center justify-between rounded-xl border-2',

            // Size
            SIZE_CLASSES[size],

            // State styles
            hasError ? 'border-red-500 bg-red-500/10' : 'border-white/20 bg-white/5',

            // Disabled state
            disabled && 'opacity-50',

            // Custom classes
            className
          )}
        >
          <Text
            className={cn(
              'flex-1',
              TEXT_SIZE_CLASSES[size],
              selectedOption ? 'text-white' : 'text-white/40'
            )}
            numberOfLines={1}
          >
            {selectedOption ? selectedOption.label : placeholder || ''}
          </Text>
          <ChevronDown
            size={ICON_SIZES[size]}
            color={disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)'}
          />
        </Pressable>

        {/* Options modal */}
        <Modal
          transparent
          animationType="fade"
          visible={isOpen}
          onRequestClose={() => setIsOpen(false)}
        >
          <Pressable
            onPress={() => setIsOpen(false)}
            className="flex-1 justify-center bg-black/60 p-6"
          >
            <View className="max-h-[70%] overflow-hidden rounded-2xl border border-white/10 bg-charcoal-500">
              {placeholder && (
                <View className="border-b border-white/10 px-4 py-3">
                  <Text className="text-sm font-semibold uppercase text-white/50">
                    {placeholder}
                  </Text>
                </View>
              )}
              <ScrollView keyboardShouldPersistTaps="handled">
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => handleSelect(option.value)}
                      disabled={option.disabled}
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected: isSelected, disabled: option.disabled }}
                      className={cn(
                        'flex-row items-center justify-between px-4 py-3 active:bg-white/10',
                        option.disabled && 'opacity-40'
                      )}
                    >
                      <Text
                        className={cn(
                          'flex-1 text-base',
                          isSelected ? 'font-semibold text-teal-400' : 'text-white'
                        )}
                      >
                        {option.label}
                      </Text>
                      {isSelected && <Check size={18} color="#2BD4BD" />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  }
);

Select.displayName = 'Select';
