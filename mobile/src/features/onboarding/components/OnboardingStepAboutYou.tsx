/**
 * Onboarding Step - About You
 *
 * Collects personalization data right after identity: primary motivation,
 * experience level with habits, and age range. Persisted to the profile so
 * the game can tailor tone and content.
 */

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { useOnboarding, useTheme } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui';
import { cn } from '@/utils';
import {
  MOTIVATION_OPTIONS,
  EXPERIENCE_OPTIONS,
  AGE_RANGE_OPTIONS,
} from '@/constants';
import { themeHsl } from '@/theme/themeVars';
import type { ExperienceLevel } from '@/types/user';

interface OnboardingStepAboutYouProps {
  onNext: () => void;
  onPrev: () => void;
}

export function OnboardingStepAboutYou({ onNext, onPrev }: OnboardingStepAboutYouProps) {
  const { t } = useLocale();
  const { theme } = useTheme();
  const { temporaryData, saveStepData, completeStep } = useOnboarding();

  const [motivation, setMotivation] = useState<string | undefined>(temporaryData.motivation);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | undefined>(
    temporaryData.experienceLevel
  );
  const [ageRange, setAgeRange] = useState<string | undefined>(temporaryData.ageRange);

  const isValid = Boolean(motivation && experienceLevel && ageRange);

  const primaryColor = themeHsl(theme, '--primary');
  const primaryForeground = themeHsl(theme, '--primary-foreground');

  const handleSubmit = () => {
    if (!isValid) return;
    saveStepData({ motivation, experienceLevel, ageRange });
    completeStep(1);
    onNext();
  };

  const chip = (selected: boolean) =>
    cn(
      'rounded-2xl px-4 py-3',
      selected
        ? 'border-2 border-teal-400/70 bg-teal-500/15'
        : 'border border-white/10 bg-white/[0.04] active:bg-white/[0.07]'
    );

  const chipText = (selected: boolean) =>
    cn('text-sm font-semibold', selected ? 'text-teal-100' : 'text-white/70');

  return (
    <GlassCard className="mx-auto w-full max-w-2xl rounded-3xl p-6">
      {/* Header */}
      <View className="mb-8 items-center">
        <View className="mb-2 flex-row items-center justify-center gap-2">
          <Sparkles color={primaryColor} size={28} />
          <Text className="text-center text-2xl font-extrabold uppercase tracking-wide text-white">
            {t('onboarding.aboutYou.title')}
          </Text>
        </View>
        <Text className="text-center font-medium text-white/75">
          {t('onboarding.aboutYou.description')}
        </Text>
      </View>

      <View className="gap-8">
        {/* Motivation */}
        <View>
          <Text className="mb-3 text-sm font-bold uppercase tracking-wide text-white/90">
            {t('onboarding.aboutYou.motivationLabel')}
          </Text>
          <View className="flex-row flex-wrap gap-2.5">
            {MOTIVATION_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: motivation === option.value }}
                onPress={() => setMotivation(option.value)}
                className={cn(chip(motivation === option.value), 'w-[48%]')}
              >
                <Text className={chipText(motivation === option.value)}>
                  <Text>{option.emoji}</Text> {t(option.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Experience level */}
        <View>
          <Text className="mb-3 text-sm font-bold uppercase tracking-wide text-white/90">
            {t('onboarding.aboutYou.experienceLabel')}
          </Text>
          <View className="flex-row gap-2.5">
            {EXPERIENCE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: experienceLevel === option.value }}
                onPress={() => setExperienceLevel(option.value)}
                className={cn(chip(experienceLevel === option.value), 'flex-1 items-center')}
              >
                <Text className={cn(chipText(experienceLevel === option.value), 'text-center')}>
                  {t(option.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Age range */}
        <View>
          <Text className="mb-3 text-sm font-bold uppercase tracking-wide text-white/90">
            {t('onboarding.aboutYou.ageLabel')}
          </Text>
          <View className="flex-row flex-wrap gap-2.5">
            {AGE_RANGE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: ageRange === option.value }}
                onPress={() => setAgeRange(option.value)}
                className={cn(chip(ageRange === option.value), 'w-[30%] items-center')}
              >
                <Text className={cn(chipText(ageRange === option.value), 'text-center')}>
                  {t(option.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Navigation */}
        <View className="flex-row items-center justify-between pt-2">
          <Button variant="secondary" onClick={onPrev} className="px-6">
            {t('onboarding.prevButton')}
          </Button>
          <Pressable
            onPress={handleSubmit}
            disabled={!isValid}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid }}
            className={cn(
              'flex-row items-center justify-center gap-2 rounded-xl px-6 py-3',
              !isValid ? 'bg-gray-700' : 'bg-primary active:opacity-90'
            )}
          >
            <Text
              className={cn('font-semibold', !isValid ? 'text-gray-400' : 'text-primary-foreground')}
            >
              {t('onboarding.nextButton')}
            </Text>
            <ArrowRight size={20} color={!isValid ? '#9CA3AF' : primaryForeground} />
          </Pressable>
        </View>
      </View>
    </GlassCard>
  );
}

export default OnboardingStepAboutYou;
