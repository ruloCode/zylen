/**
 * SheetShell — internal helper for the habits feature (native only).
 * Replaces the web's `fixed inset-0 ... items-end` overlay recipe with a
 * transparent RN Modal anchored to the bottom (slide-up animation) and a
 * pressable backdrop. Every habit sheet/modal renders inside this shell.
 */

import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { cn } from '@/utils/cn';

interface SheetShellProps {
  onClose: () => void;
  children: React.ReactNode;
  /** fixed height (e.g. '90%') — use when children need flex-1 scroll areas */
  height?: number | `${number}%`;
  /** extra classes for the sheet container */
  className?: string;
  accessibilityLabel?: string;
}

export function SheetShell({
  onClose,
  children,
  height,
  className,
  accessibilityLabel,
}: SheetShellProps) {
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        {/* Backdrop press closes the sheet */}
        <Pressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
        >
          <View
            className={cn(
              'w-full overflow-hidden rounded-t-3xl border border-white/10 bg-charcoal-500',
              className
            )}
            style={height != null ? { height } : { maxHeight: '92%' }}
            accessibilityViewIsModal
            accessibilityLabel={accessibilityLabel}
          >
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default SheetShell;
