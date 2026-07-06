import React from 'react';
import { Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { cn } from '@/utils';
import { useLocale } from '@/hooks/useLocale';
import { TOTAL_ONBOARDING_STEPS } from '@/types';

interface OnboardingProgressProps {
  currentStep: number;
  completedSteps: number[];
}

/**
 * OnboardingProgress Component
 *
 * Shows a visual progress indicator for the onboarding flow
 */
export function OnboardingProgress({ currentStep, completedSteps }: OnboardingProgressProps) {
  const { t } = useLocale();
  const steps = Array.from({ length: TOTAL_ONBOARDING_STEPS }, (_, i) => i);

  return (
    <View
      accessibilityLabel={t('onboarding.progress.ariaLabel')}
      className="mx-auto w-full max-w-md"
    >
      <View className="flex-row items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step);
          const isCurrent = step === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step}>
              {/* Step Circle */}
              <View className="items-center gap-2">
                <View
                  className={cn(
                    'h-11 w-11 items-center justify-center rounded-full border-2',
                    isCompleted
                      ? 'border-primary/70 bg-primary/70'
                      : isCurrent
                      ? 'scale-110 border-primary bg-primary'
                      : 'border-white/10 bg-white/5'
                  )}
                  accessibilityState={{ selected: isCurrent }}
                >
                  {isCompleted ? (
                    <Check size={20} color="#FFFFFF" />
                  ) : (
                    <Text
                      className={cn(
                        'text-sm font-bold',
                        isCurrent ? 'text-white' : 'text-gray-400'
                      )}
                    >
                      {step + 1}
                    </Text>
                  )}
                </View>
                {/* Step labels are hidden on mobile (web hides them below `sm`) */}
              </View>

              {/* Connector Line */}
              {!isLast && (
                <View
                  className={cn(
                    'mx-2 h-0.5 flex-1',
                    isCompleted ? 'bg-primary/70' : 'bg-charcoal-600'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Progress Text */}
      <View className="mt-4 items-center">
        <Text className="text-sm text-gray-400" accessibilityLiveRegion="polite">
          {t('onboarding.progress.stepOf', {
            current: currentStep + 1,
            total: TOTAL_ONBOARDING_STEPS,
          })}
        </Text>
      </View>
    </View>
  );
}

export default OnboardingProgress;
