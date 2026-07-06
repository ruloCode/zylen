import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowLeft, ArrowRight, Palette } from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';
import { ThemeSelector } from '@/features/settings/components';

interface OnboardingStepThemeProps {
  onNext: () => void;
  onPrev: () => void;
}

/**
 * Onboarding Step: Theme selection.
 * Picking a theme applies & persists instantly (via the themeSlice), so there's
 * no need to thread the choice through onboarding temporaryData/finalize.
 */
export function OnboardingStepTheme({ onNext, onPrev }: OnboardingStepThemeProps) {
  const { t } = useLocale();

  return (
    <View className="mx-auto w-full max-w-2xl">
      {/* Title */}
      <View className="mb-8 items-center">
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/20">
          <Palette size={26} color="#2dd4bf" />
        </View>
        <Text className="mb-3 text-center text-2xl font-bold text-white">
          {t('themes.onboardingPrompt')}
        </Text>
        <Text className="text-center text-gray-300">{t('themes.onboardingHint')}</Text>
      </View>

      {/* Theme grid */}
      <View className="mb-8">
        <ThemeSelector variant="grid" />
      </View>

      {/* Navigation */}
      <View className="flex-row gap-4">
        <Pressable
          onPress={onPrev}
          accessibilityRole="button"
          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border-2 border-charcoal-600 bg-charcoal-700 px-6 py-3 active:bg-charcoal-600"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
          <Text className="font-semibold text-white">{t('onboarding.prevButton')}</Text>
        </Pressable>

        <Pressable
          onPress={onNext}
          accessibilityRole="button"
          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-3 active:bg-teal-600"
        >
          <Text className="font-semibold text-white">{t('onboarding.nextButton')}</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

export default OnboardingStepTheme;
