/**
 * Onboarding Step - Username Selection
 * Step 2: Choose a unique username for social features
 */

import { useState } from 'react';
import { useOnboarding } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { Button } from '@/components/ui/Button';
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
  const { temporaryData, setTemporaryData } = useOnboarding();
  const [canSkip] = useState(true); // Username is optional during onboarding

  const handleUsernameSet = (username: string) => {
    setTemporaryData({ ...temporaryData, username });
    onNext();
  };

  const handleSkip = () => {
    // User can set username later in Profile
    onNext();
  };

  return (
    <div className="glass-card p-8 rounded-3xl max-w-2xl mx-auto">
      <div className="space-y-8">
        {/* Username Selector */}
        <UsernameSelector
          defaultName={temporaryData.userName}
          onUsernameSet={handleUsernameSet}
          onSkip={handleSkip}
          showSkipButton={canSkip}
        />

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            variant="secondary"
            onClick={onPrev}
            className="px-6"
          >
            {t('onboarding.prevButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}
