/**
 * Onboarding Step - Username Selection
 * Step 2: Choose a unique username for social features
 */

import { useState } from 'react';
import { View } from 'react-native';
import { useOnboarding } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui';
import { UsernameSelector } from '@/features/social/components';

interface OnboardingStepUsernameProps {
  onNext: () => void;
  onPrev: () => void;
}

export function OnboardingStepUsername({
  onNext,
  onPrev,
}: OnboardingStepUsernameProps) {
  const { t } = useLocale();
  const { temporaryData, saveStepData } = useOnboarding();
  const [canSkip] = useState(true); // Username is optional during onboarding

  const handleUsernameSet = (username: string) => {
    saveStepData({ username });
    onNext();
  };

  const handleSkip = () => {
    // User can set username later in Profile
    onNext();
  };

  return (
    <GlassCard className="mx-auto w-full max-w-2xl rounded-3xl p-8">
      <View className="gap-8">
        {/* Username Selector */}
        <UsernameSelector
          defaultName={temporaryData.userName}
          onUsernameSet={handleUsernameSet}
          onSkip={handleSkip}
          showSkipButton={canSkip}
        />

        {/* Navigation Buttons */}
        <View className="flex-row justify-between pt-4">
          <Button
            variant="secondary"
            onClick={onPrev}
            className="px-6"
          >
            {t('onboarding.prevButton')}
          </Button>
        </View>
      </View>
    </GlassCard>
  );
}
