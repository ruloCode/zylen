import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useTheme } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { themeHsl } from '@/theme/themeVars';
import { TOTAL_ONBOARDING_STEPS } from '@/types';

interface OnboardingProgressProps {
  currentStep: number;
  /** kept for API compatibility; the linear bar only needs the current step */
  completedSteps?: number[];
}

/**
 * OnboardingProgress — thin animated linear bar (Duolingo-style). Numbered
 * circles stopped scaling once the flow grew to 6 steps.
 */
export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const { t } = useLocale();
  const { theme } = useTheme();
  const pct = ((currentStep + 1) / TOTAL_ONBOARDING_STEPS) * 100;
  const anim = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // animates width
    }).start();
  }, [pct, anim]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t('onboarding.progress.ariaLabel')}
      accessibilityLiveRegion="polite"
      accessibilityValue={{
        text: t('onboarding.progress.stepOf', {
          current: currentStep + 1,
          total: TOTAL_ONBOARDING_STEPS,
        }),
      }}
      className="h-2 w-full overflow-hidden rounded-full bg-white/10"
    >
      <Animated.View
        style={{
          height: '100%',
          borderRadius: 999,
          backgroundColor: themeHsl(theme, '--primary'),
          width: anim.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </View>
  );
}

export default OnboardingProgress;
