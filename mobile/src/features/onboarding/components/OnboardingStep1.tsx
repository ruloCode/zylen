import React, { useState, useEffect } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { useOnboarding, useTheme, useUser } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { Logo } from '@/components/branding/Logo';
import { cn } from '@/utils';
import { DEFAULT_AVATAR, GENDER_OPTIONS } from '@/constants';
import { AvatarPicker, AvatarCreator } from '@/features/profile/components';
import { themeHsl } from '@/theme/themeVars';
import { ONBOARDING_STEPS } from '@/types';
import type { Gender } from '@/types/user';
import { OnboardingScreen } from './OnboardingScreen';

interface OnboardingStep1Props {
  onNext: () => void;
}

/**
 * Onboarding HERO step: name + avatar (preset or AI-generated) + identity.
 * On continue the profile is persisted early (best-effort): the rest of the
 * flow then speaks with the right name/gender, and the payoff step retries
 * if this save failed offline.
 */
export function OnboardingStep1({ onNext }: OnboardingStep1Props) {
  const { temporaryData, saveStepData, completeStep } = useOnboarding();
  const { theme } = useTheme();
  const { applyCustomAvatar, updateUserProfile } = useUser();
  const { t } = useLocale();
  const [name, setName] = useState(temporaryData.userName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(temporaryData.avatarUrl || DEFAULT_AVATAR);
  const [gender, setGender] = useState<Gender | undefined>(temporaryData.gender);
  const [error, setError] = useState('');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const primaryColor = themeHsl(theme, '--primary');
  const primaryForeground = themeHsl(theme, '--primary-foreground');

  useEffect(() => {
    // Sync from rehydrated state (hydrateForUser lands after first render)
    if (temporaryData.userName) {
      setName(temporaryData.userName);
    }
    if (temporaryData.avatarUrl) {
      setSelectedAvatar(temporaryData.avatarUrl);
    }
    if (temporaryData.gender) {
      setGender(temporaryData.gender);
    }
  }, [temporaryData.userName, temporaryData.avatarUrl, temporaryData.gender]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError(t('onboarding.step1.nameError'));
      return;
    }

    if (!gender) {
      setError(t('onboarding.identity.error'));
      return;
    }

    saveStepData({ userName: trimmedName, avatarUrl: selectedAvatar, gender });
    completeStep(ONBOARDING_STEPS.HERO);

    // Early best-effort save: offline is fine — the payoff step retries.
    setSaving(true);
    try {
      await updateUserProfile(trimmedName, selectedAvatar, { gender });
      saveStepData({ profileSaved: true });
    } catch {
      saveStepData({ profileSaved: false });
    } finally {
      setSaving(false);
    }

    onNext();
  };

  const isDisabled = name.trim().length < 2 || !gender;

  return (
    <OnboardingScreen
      step={ONBOARDING_STEPS.HERO}
      cta={{
        label: t('onboarding.step1.nextButton'),
        onPress: handleSubmit,
        disabled: isDisabled,
        loading: saving,
        icon: <ArrowRight size={20} color={primaryForeground} />,
      }}
    >
      {/* Logo */}
      <View className="mb-6 items-center">
        <Logo size="lg" />
      </View>

      {/* Welcome Message */}
      <View className="mb-6 items-center">
        <View className="mb-2 flex-row items-center justify-center gap-2">
          <Sparkles color={primaryColor} size={28} />
          <Text className="text-center text-2xl font-extrabold tracking-tight text-white">
            {t('onboarding.step1.title')}
          </Text>
        </View>
        <Text className="text-center text-base font-medium text-white/70">
          {t('onboarding.step1.description')}
        </Text>
      </View>

      <View className="gap-6">
        <View>
          <Text className="mb-2 text-sm font-semibold text-white/90">
            {t('onboarding.step1.nameLabel')}
          </Text>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError('');
            }}
            placeholder={t('onboarding.step1.namePlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.5)"
            className={cn(
              'min-h-[44px] w-full rounded-none px-4 py-3',
              'border-2 bg-[rgb(23,20,18)]',
              'font-medium text-white',
              error ? 'border-red-500' : 'border-white/20'
            )}
            maxLength={30}
            accessibilityLabel={t('onboarding.step1.nameLabel')}
          />
          {error ? (
            <Text className="mt-2 text-sm text-red-400" accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
        </View>

        {/* Avatar Selection — presets + "create one from your photo" (AI) */}
        <View>
          <Text className="mb-3 text-sm font-semibold text-white/90">
            {t('onboarding.step1.avatarLabel')}
          </Text>
          <AvatarPicker
            value={selectedAvatar}
            onChange={setSelectedAvatar}
            onCreateCustom={() => setIsCreatorOpen(true)}
          />
        </View>

        {/* Identity Selection — drives gendered language across the app */}
        <View>
          <Text className="mb-3 text-sm font-semibold text-white/90">
            {t('onboarding.identity.label')}
          </Text>
          <View
            className="flex-row gap-3"
            accessibilityRole="radiogroup"
            accessibilityLabel={t('onboarding.identity.label')}
          >
            {GENDER_OPTIONS.map((option) => {
              const isSelected = gender === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => {
                    setGender(option.value);
                    setError('');
                  }}
                  className={cn(
                    'flex-1 items-center gap-1.5 rounded-2xl p-3',
                    isSelected
                      ? 'border-2 border-teal-400/70 bg-teal-500/15'
                      : 'border border-white/10 bg-white/[0.04] active:bg-white/[0.07]'
                  )}
                >
                  <Text className="text-2xl">{option.emoji}</Text>
                  <Text
                    className={cn(
                      'text-center text-[11px] font-semibold leading-tight',
                      isSelected ? 'text-teal-200' : 'text-white/60'
                    )}
                  >
                    {t(option.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="mt-2 text-xs text-white/45">{t('onboarding.identity.hint')}</Text>
        </View>
      </View>

      {/* Helper Text */}
      <Text className="mt-6 text-center text-sm text-gray-400">
        {t('onboarding.step1.helperText')}
      </Text>

      {/* AI avatar creator — AvatarService.save already persists both URLs in
          the profile; here we also select the bust for the onboarding flow and
          mirror the pair into the store so the Home hero is right on arrival. */}
      {isCreatorOpen && (
        <AvatarCreator
          gender={gender}
          onClose={() => setIsCreatorOpen(false)}
          onSaved={(avatarUrl, avatarBodyUrl) => {
            applyCustomAvatar(avatarUrl, avatarBodyUrl);
            setSelectedAvatar(avatarUrl);
            setIsCreatorOpen(false);
          }}
        />
      )}
    </OnboardingScreen>
  );
}

export default OnboardingStep1;
