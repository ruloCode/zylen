/**
 * Modal — React Native port.
 * Uses the native Modal (transparent + fade) with a pressable backdrop.
 * Same props/API as the web version; ESC handling maps to the hardware
 * back button via onRequestClose.
 */

import React from 'react';
import {
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { cn } from '@/utils/cn';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when the modal should be closed */
  onClose: () => void;
  /** Modal title (optional) */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Maximum width of the modal */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Custom className for the modal container */
  className?: string;
}

// Tailwind max-w-* scale in px
const MAX_WIDTHS: Record<NonNullable<ModalProps['maxWidth']>, number> = {
  sm: 384,
  md: 448,
  lg: 512,
  xl: 576,
  '2xl': 672,
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
  className,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <RNModal transparent animationType="fade" visible={isOpen} onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 p-4">
        {/* Backdrop press closes the modal */}
        <Pressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close modal"
        />

        <View
          className={cn(
            'w-full overflow-hidden rounded-3xl border border-white/10 bg-charcoal-500',
            className
          )}
          style={{ maxWidth: MAX_WIDTHS[maxWidth], maxHeight: '85%' }}
          accessibilityViewIsModal
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View className="flex-row items-center justify-between border-b border-white/10 bg-charcoal-600 px-6 py-4">
              {title && <Text className="flex-1 text-2xl font-bold text-white">{title}</Text>}
              {showCloseButton && (
                <Pressable
                  onPress={onClose}
                  className="ml-auto rounded-xl p-2 active:bg-white/10"
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                >
                  <X size={24} color="#FFFFFF" />
                </Pressable>
              )}
            </View>
          )}

          {/* Content */}
          <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
}
