import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { useOnboarding, useTheme } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';
import { themeHsl } from '@/theme/themeVars';
import { TIME_OF_DAY_OPTIONS } from '@/constants';
import { ONBOARDING_STEPS } from '@/types';
import type { TimeOfDay } from '@/types';
import { OnboardingScreen } from './OnboardingScreen';

interface OnboardingStepTimeOfDayProps {
  onNext: () => void;
  onPrev: () => void;
}

const ADVANCE_DELAY_MS = 250;

/**
 * Onboarding: single tap-question — when do you want to work on yourself.
 * Sets the first habit's timeOfDay and the coach reminder slot, so the
 * answer is actionable, not decorative.
 */
export function OnboardingStepTimeOfDay({ onNext, onPrev }: OnboardingStepTimeOfDayProps) {
  const { temporaryData, saveStepData, completeStep } = useOnboarding();
  const { theme } = useTheme();
  const { t } = useLocale();
  const [selected, setSelected] = useState<TimeOfDay | undefined>(
    temporaryData.preferredTimeOfDay
  );
  const advancing = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const themeBg = themeHsl(theme, '--background');

  const handleSelect = (value: TimeOfDay) => {
    if (advancing.current) return;
    advancing.current = true;
    setSelected(value);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveStepData({ preferredTimeOfDay: value });
    completeStep(ONBOARDING_STEPS.TIME_OF_DAY);
    advanceTimer.current = setTimeout(onNext, ADVANCE_DELAY_MS);
  };

  return (
    <OnboardingScreen
      step={ONBOARDING_STEPS.TIME_OF_DAY}
      onBack={onPrev}
      title={t('onboarding.timeOfDay.title')}
      subtitle={t('onboarding.timeOfDay.subtitle')}
    >
      <View className="gap-3" accessibilityRole="radiogroup">
        {TIME_OF_DAY_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              onPress={() => handleSelect(option.value)}
              className={cn(
                'w-full flex-row items-center gap-4 rounded-2xl border p-4',
                isSelected
                  ? 'border-teal-400/70 bg-teal-500/15'
                  : 'border-white/10 bg-white/[0.04] active:bg-white/[0.07]'
              )}
            >
              <Text className="text-3xl">{option.emoji}</Text>
              <Text
                className={cn(
                  'flex-1 text-base font-semibold',
                  isSelected ? 'text-teal-200' : 'text-white/85'
                )}
              >
                {t(option.labelKey)}
              </Text>
              {isSelected && (
                <View className="h-6 w-6 items-center justify-center rounded-full bg-teal-400">
                  <Check size={15} strokeWidth={3} color={themeBg} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </OnboardingScreen>
  );
}

export default OnboardingStepTimeOfDay;
