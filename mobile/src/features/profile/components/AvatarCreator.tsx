/**
 * AvatarCreator — React Native port of the web AvatarCreator.
 *
 * Full flow to create a personalized AI avatar from a user photo, rendered
 * in the app's chibi hero style via the `generate-avatar` Edge Function
 * (Nano Banana / Gemini). Self-contained bottom sheet:
 *
 *   pick photo (expo-image-picker) → generating (~30-60s) → preview → save
 *
 * Saving uploads both PNGs to storage and updates the profile; the parent
 * gets the final URLs through onSaved to sync local state.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, RefreshCw, Sparkles, Wand2, X } from 'lucide-react-native';
import { cn } from '@/utils';
import { useLocale } from '@/hooks/useLocale';
import {
  AvatarService,
  AvatarGenerationError,
  type GeneratedAvatar,
} from '@/services/supabase/avatar.service';
import type { Gender } from '@/types/user';

const TEAL_300 = '#5EEAD4';
const WHITE = '#FFFFFF';

interface AvatarCreatorProps {
  /** Player identity — picks the style reference (female → Dani). */
  gender?: Gender;
  onClose: () => void;
  /** Called after the avatar is uploaded + persisted in the profile. */
  onSaved: (avatarUrl: string, avatarBodyUrl: string) => void;
}

type Step = 'pick' | 'ready' | 'generating' | 'preview' | 'saving';

/** Rotating status lines while Gemini works (i18n keys). */
const GENERATING_KEYS = [
  'profile.avatarCreator.generating1',
  'profile.avatarCreator.generating2',
  'profile.avatarCreator.generating3',
] as const;

export function AvatarCreator({ gender, onClose, onSaved }: AvatarCreatorProps) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('pick');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedAvatar | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Compact technical cause (Gemini reason / failing stage / HTTP) shown under
  // the friendly message so a failure is diagnosable from a screenshot.
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  // Guards against state updates from a generation the user abandoned.
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  // Rotate the "generating" copy so the long wait feels alive.
  useEffect(() => {
    if (step !== 'generating') return;
    const interval = setInterval(
      () => setMessageIndex((i) => (i + 1) % GENERATING_KEYS.length),
      6000
    );
    return () => clearInterval(interval);
  }, [step]);

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    const uri = result.assets?.[0]?.uri;
    if (result.canceled || !uri) return;
    setPhotoUri(uri);
    setError(null);
    setErrorDetail(null);
    setStep('ready');
  };

  const handleGenerate = async () => {
    if (!photoUri) return;
    setError(null);
    setErrorDetail(null);
    setMessageIndex(0);
    setStep('generating');
    try {
      const result = await AvatarService.generate(photoUri, gender);
      if (!activeRef.current) {
        result.dispose();
        return;
      }
      generated?.dispose();
      setGenerated(result);
      setStep('preview');
    } catch (err) {
      if (!activeRef.current) return;
      console.error('Avatar generation failed:', err);
      const code = err instanceof AvatarGenerationError ? err.code : undefined;
      setError(
        code === 'daily_limit_reached'
          ? t('profile.avatarCreator.limitError')
          : code === 'photo_rejected'
            ? t('profile.avatarCreator.photoRejected')
            : t('profile.avatarCreator.error')
      );
      // Surface the technical cause for anything that isn't the two "expected"
      // outcomes (limit / photo rejected) — that's where diagnosis matters.
      const detail = err instanceof AvatarGenerationError ? err.detail : undefined;
      setErrorDetail(code === 'daily_limit_reached' || code === 'photo_rejected' ? null : detail ?? null);
      setStep('ready');
    }
  };

  const handleSave = async () => {
    if (!generated) return;
    setError(null);
    setStep('saving');
    try {
      const saved = await AvatarService.save(generated);
      if (!activeRef.current) return;
      onSaved(saved.avatarUrl, saved.avatarBodyUrl);
    } catch (err) {
      if (!activeRef.current) return;
      console.error('Avatar save failed:', err);
      setError(t('profile.avatarCreator.error'));
      setStep('preview');
    }
  };

  const busy = step === 'generating' || step === 'saving';

  return (
    <Modal transparent animationType="slide" visible onRequestClose={busy ? undefined : onClose}>
      <View className="flex-1 justify-end bg-black/60">
        {/* Backdrop */}
        <Pressable
          className="absolute inset-0"
          onPress={busy ? undefined : onClose}
          accessibilityLabel={t('common.cancel')}
        />

        <View
          className="max-h-[92%] rounded-t-3xl border border-white/10 bg-charcoal-500"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <ScrollView className="px-5 pt-5" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="mb-1 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Wand2 size={18} color={TEAL_300} />
                <Text className="text-lg font-bold text-white">
                  {t('profile.avatarCreator.title')}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
                className={cn(
                  'h-8 w-8 items-center justify-center rounded-full bg-white/10 active:bg-white/20',
                  busy && 'opacity-40'
                )}
              >
                <X size={18} color={WHITE} />
              </Pressable>
            </View>
            <Text className="mb-4 text-sm text-white/60">
              {t('profile.avatarCreator.subtitle')}
            </Text>

            {/* Step: pick / ready — photo selection */}
            {(step === 'pick' || step === 'ready') && (
              <View className="gap-4 pb-4">
                <Pressable
                  onPress={handlePickPhoto}
                  accessibilityRole="button"
                  accessibilityLabel={
                    photoUri
                      ? t('profile.avatarCreator.changePhoto')
                      : t('profile.avatarCreator.pickPhoto')
                  }
                  className="w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.03] py-6 active:bg-white/[0.06]"
                >
                  {photoUri ? (
                    <Image
                      source={{ uri: photoUri }}
                      accessibilityLabel={t('profile.avatarCreator.photoAlt')}
                      contentFit="cover"
                      style={{ width: 128, height: 128, borderRadius: 16 }}
                    />
                  ) : (
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-teal-500/15">
                      <Camera size={28} color={TEAL_300} />
                    </View>
                  )}
                  <Text className="text-sm font-semibold text-white/80">
                    {photoUri
                      ? t('profile.avatarCreator.changePhoto')
                      : t('profile.avatarCreator.pickPhoto')}
                  </Text>
                </Pressable>

                {error ? (
                  <View>
                    <Text className="text-sm text-danger-400" accessibilityRole="alert">
                      {error}
                    </Text>
                    {errorDetail ? (
                      <Text className="mt-1 text-[11px] text-white/35">
                        {t('profile.avatarCreator.errorDetail', { detail: errorDetail })}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                <Pressable
                  onPress={handleGenerate}
                  disabled={!photoUri}
                  accessibilityRole="button"
                  className={cn(
                    'w-full flex-row items-center justify-center gap-2 rounded-xl py-3',
                    photoUri ? 'bg-teal-500 active:bg-teal-600' : 'bg-charcoal-700 opacity-60'
                  )}
                >
                  <Sparkles size={18} color={photoUri ? WHITE : 'rgba(255,255,255,0.4)'} />
                  <Text
                    className={cn(
                      'font-semibold',
                      photoUri ? 'text-white' : 'text-white/40'
                    )}
                  >
                    {t('profile.avatarCreator.generate')}
                  </Text>
                </Pressable>

                <Text className="text-center text-xs text-white/40">
                  {t('profile.avatarCreator.privacy')}
                </Text>
              </View>
            )}

            {/* Step: generating */}
            {step === 'generating' && (
              <View className="items-center gap-4 py-10">
                <View className="h-16 w-16 items-center justify-center">
                  <ActivityIndicator size="large" color={TEAL_300} />
                </View>
                <Text
                  className="text-center font-semibold text-white/80"
                  accessibilityLiveRegion="polite"
                >
                  {t(GENERATING_KEYS[messageIndex] ?? GENERATING_KEYS[0])}
                </Text>
                <Text className="text-xs text-white/40">
                  {t('profile.avatarCreator.generatingHint')}
                </Text>
              </View>
            )}

            {/* Step: preview / saving */}
            {(step === 'preview' || step === 'saving') && generated && (
              <View className="gap-4 pb-4">
                <View className="flex-row items-end justify-center gap-4">
                  <View className="items-center gap-2">
                    <View className="h-28 w-28 items-center justify-center rounded-full bg-teal-500 p-[3px]">
                      <Image
                        source={{ uri: generated.bustPreviewUrl }}
                        accessibilityLabel={t('profile.avatarCreator.bustAlt')}
                        contentFit="cover"
                        contentPosition="top"
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 999,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                        }}
                      />
                    </View>
                    <Text className="text-[11px] font-semibold text-white/60">
                      {t('profile.avatarCreator.bustLabel')}
                    </Text>
                  </View>
                  <View className="items-center gap-2">
                    <Image
                      source={{ uri: generated.bodyPreviewUrl }}
                      accessibilityLabel={t('profile.avatarCreator.bodyAlt')}
                      contentFit="contain"
                      style={{ height: 192, width: 128 }}
                    />
                    <Text className="text-[11px] font-semibold text-white/60">
                      {t('profile.avatarCreator.bodyLabel')}
                    </Text>
                  </View>
                </View>

                {error ? (
                  <Text className="text-sm text-danger-400" accessibilityRole="alert">
                    {error}
                  </Text>
                ) : null}

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={handleGenerate}
                    disabled={step === 'saving'}
                    accessibilityRole="button"
                    className={cn(
                      'flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-white/10 py-3 active:bg-white/20',
                      step === 'saving' && 'opacity-40'
                    )}
                  >
                    <RefreshCw size={16} color={WHITE} />
                    <Text className="font-semibold text-white">
                      {t('profile.avatarCreator.retry')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSave}
                    disabled={step === 'saving'}
                    accessibilityRole="button"
                    className={cn(
                      'flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 active:bg-teal-600',
                      step === 'saving' && 'opacity-60'
                    )}
                  >
                    {step === 'saving' ? (
                      <ActivityIndicator size="small" color={WHITE} />
                    ) : (
                      <Sparkles size={16} color={WHITE} />
                    )}
                    <Text className="font-semibold text-white">
                      {t('profile.avatarCreator.use')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default AvatarCreator;
