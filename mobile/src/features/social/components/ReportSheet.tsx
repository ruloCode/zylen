/**
 * ReportSheet — hoja común de denuncia de contenido/usuarios (compliance UGC).
 *
 * Recibe el envío por props: quien la abre decide el tipo de contenido y el
 * usuario denunciado; aquí solo se elige motivo + detalle opcional. Mismo
 * patrón de Modal-bottom-sheet que GuardianProfileSheet.
 *
 * El feedback de error es INLINE (no toast): el host de toasts vive en el
 * árbol raíz y en Android un Modal es una ventana aparte — un toast disparado
 * con la hoja abierta jamás se vería.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, Check, Flag, X } from 'lucide-react-native';
import toast from '@/lib/toast';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';
import type { ReportReason } from '@/services/supabase/moderation.service';

const REASONS: ReportReason[] = ['spam', 'harassment', 'inappropriate', 'other'];

interface ReportSheetProps {
  /** Título contextual, p.ej. "Reportar mensaje" */
  title: string;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => Promise<void>;
}

/** Errores del servidor con mensaje propio (RAISE del RPC report_content). */
function errorKeyFor(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('rate_limited')) return 'moderation.rateLimited';
  if (message.includes('already_reported')) return 'moderation.alreadyReported';
  return 'moderation.reportError';
}

export function ReportSheet({ title, onClose, onSubmit }: ReportSheetProps) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    setErrorKey(null);
    try {
      await onSubmit(reason, details.trim());
      // Cerrar primero: el toast del host raíz no se ve bajo el Modal.
      onClose();
      toast.success(t('moderation.reportSent'));
    } catch (error) {
      setErrorKey(errorKeyFor(error));
      setSubmitting(false);
    }
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/60"
      >
        <Pressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={t('actions.close')}
        />
        <View
          className="w-full overflow-hidden rounded-t-3xl border border-white/10 bg-charcoal-500"
          style={{ maxHeight: '88%' }}
          accessibilityViewIsModal
          accessibilityLabel={title}
        >
          <View className="items-center pb-1 pt-3">
            <View className="h-1 w-10 rounded-full bg-white/20" />
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('actions.close')}
            className="absolute right-4 top-4 z-20 h-9 w-9 items-center justify-center rounded-xl bg-black/40 active:bg-black/60"
          >
            <X size={20} color="rgba(255,255,255,0.8)" />
          </Pressable>

          <ScrollView
            className="px-5 pt-2"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-1 flex-row items-center gap-2">
              <Flag size={18} color="#f87171" />
              <Text className="text-lg font-extrabold text-white">{title}</Text>
            </View>
            <Text className="mb-4 text-[12.5px] leading-snug text-white/55">
              {t('moderation.reportHint')}
            </Text>

            <View className="gap-2.5" accessibilityRole="radiogroup">
              {REASONS.map((value) => {
                const selected = reason === value;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => setReason(value)}
                    className={cn(
                      'w-full flex-row items-center gap-3 rounded-2xl border p-3.5',
                      selected
                        ? 'border-red-400/60 bg-red-500/10'
                        : 'border-white/10 bg-white/[0.04] active:bg-white/[0.07]'
                    )}
                  >
                    <Text
                      className={cn(
                        'flex-1 text-sm font-semibold',
                        selected ? 'text-red-200' : 'text-white/85'
                      )}
                    >
                      {t(`moderation.reasons.${value}`)}
                    </Text>
                    {selected && (
                      <View className="h-5 w-5 items-center justify-center rounded-full bg-red-400">
                        <Check size={13} strokeWidth={3} color="#1c1917" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder={t('moderation.detailsPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              maxLength={500}
              accessibilityLabel={t('moderation.detailsPlaceholder')}
              className="mt-3 min-h-[72px] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white"
              style={{ textAlignVertical: 'top' }}
            />

            {errorKey && (
              <View
                className="mt-3 flex-row items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2.5"
                accessibilityRole="alert"
              >
                <AlertCircle size={15} color="#f87171" />
                <Text className="flex-1 text-[12.5px] font-semibold text-red-300">
                  {t(errorKey)}
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => void handleSubmit()}
              disabled={!reason || submitting}
              accessibilityRole="button"
              accessibilityState={{ disabled: !reason || submitting, busy: submitting }}
              className={cn(
                'mt-4 w-full flex-row items-center justify-center gap-2 rounded-2xl py-3.5',
                !reason || submitting ? 'bg-gray-700' : 'bg-red-500/90 active:opacity-90'
              )}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Flag size={16} color={!reason ? '#9CA3AF' : '#FFFFFF'} />
              )}
              <Text
                className={cn(
                  'text-sm font-bold',
                  !reason || submitting ? 'text-gray-400' : 'text-white'
                )}
              >
                {t('moderation.submitReport')}
              </Text>
            </Pressable>

            <Text className="mt-3 text-center text-[11px] leading-relaxed text-white/40">
              {t('moderation.reviewNote')}
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default ReportSheet;
