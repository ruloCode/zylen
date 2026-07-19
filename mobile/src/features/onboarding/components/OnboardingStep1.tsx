import React, { useState, useEffect } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { useOnboarding, useTheme } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { Logo } from '@/components/branding/Logo';
import { cn } from '@/utils';
import { DEFAULT_AVATAR, GENDER_OPTIONS } from '@/constants';
import { AvatarPicker } from '@/features/profile/components';
import { themeHsl } from '@/theme/themeVars';
import type { Gender } from '@/types/user';

interface OnboardingStep1Props {
  onNext: () => void;
}

/**
 * Onboarding Step 1: Welcome + Name Input
 */
export function OnboardingStep1({ onNext }: OnboardingStep1Props) {
  const { temporaryData, saveStepData, completeStep } = useOnboarding();
  const { theme } = useTheme();
  const { t } = useLocale();
  const [name, setName] = useState(temporaryData.userName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(temporaryData.avatarUrl || DEFAULT_AVATAR);
  const [gender, setGender] = useState<Gender | undefined>(temporaryData.gender);
  const [error, setError] = useState('');

  const primaryColor = themeHsl(theme, '--primary');
  const primaryForeground = themeHsl(theme, '--primary-foreground');

  useEffect(() => {
    // Load saved name and avatar if exists
    if (temporaryData.userName) {
      setName(temporaryData.userName);
    }
    if (temporaryData.avatarUrl) {
      setSelectedAvatar(temporaryData.avatarUrl);
    }
  }, [temporaryData.userName, temporaryData.avatarUrl]);

  const handleSubmit = () => {
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError(t('onboarding.step1.nameError'));
      return;
    }

    if (!gender) {
      setError(t('onboarding.identity.error'));
      return;
    }

    // Save name, avatar and identity to temporary data
    saveStepData({ userName: trimmedName, avatarUrl: selectedAvatar, gender });
    completeStep(0);
    onNext();
  };

  const isDisabled = name.trim().length < 2 || !gender;

  return (
    <View className="mx-auto w-full max-w-md">
      {/* Logo */}
      <View className="mb-8 items-center">
        <Logo size="lg" />
      </View>

      {/* Welcome Message */}
      <View className="mb-8 items-center">
        <View className="mb-3 flex-row items-center justify-center gap-2">
          <Sparkles color={primaryColor} size={32} />
          <Text className="text-center text-2xl font-extrabold tracking-tight text-white">
            {t('onboarding.step1.title')}
          </Text>
        </View>
        <Text className="text-center text-lg font-semibold text-white/85">
          {t('onboarding.step1.description')}
        </Text>
      </View>

      {/* Name Input Form */}
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
            autoFocus
            maxLength={30}
            accessibilityLabel={t('onboarding.step1.nameLabel')}
          />
          {error ? (
            <Text className="mt-2 text-sm text-red-400" accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
        </View>

        {/* Avatar Selection */}
        <View>
          <Text className="mb-3 text-sm font-semibold text-white/90">
            {t('onboarding.step1.avatarLabel')}
          </Text>
          <AvatarPicker value={selectedAvatar} onChange={setSelectedAvatar} />
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

        {/* Next Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isDisabled}
          accessibilityRole="button"
          accessibilityState={{ disabled: isDisabled }}
          className={cn(
            'w-full flex-row items-center justify-center gap-2 rounded-xl px-6 py-3',
            isDisabled ? 'bg-gray-700' : 'bg-primary active:opacity-90'
          )}
        >
          <Text
            className={cn('font-semibold', isDisabled ? 'text-gray-400' : 'text-primary-foreground')}
          >
            {t('onboarding.step1.nextButton')}
          </Text>
          <ArrowRight size={20} color={isDisabled ? '#9CA3AF' : primaryForeground} />
        </Pressable>
      </View>

      {/* Helper Text */}
      <Text className="mt-6 text-center text-sm text-gray-400">
        {t('onboarding.step1.helperText')}
      </Text>
    </View>
  );
}

export default OnboardingStep1;
