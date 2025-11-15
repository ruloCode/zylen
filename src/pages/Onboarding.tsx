import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding, useUser, useHabits, useLifeAreas } from '@/store';
import { ROUTES } from '@/constants/routes';
import { ONBOARDING_STEPS } from '@/types';
import {
  OnboardingProgress,
  OnboardingStep1,
  OnboardingStep2,
  OnboardingStep3,
  OnboardingStep4,
} from '@/features/onboarding/components';

/**
 * Onboarding Page
 *
 * Multi-step onboarding flow for new users
 * Steps:
 * 1. Welcome + Name
 * 2. Life Areas Selection
 * 3. Create First Habits
 * 4. Tutorial / Mechanics Overview
 */
export function Onboarding() {
  const navigate = useNavigate();
  const {
    currentStep,
    completedSteps,
    temporaryData,
    nextStep,
    prevStep,
    finalizeOnboarding,
  } = useOnboarding();
  const { user, updateUserProfile, completeOnboarding, updateSelectedLifeAreas } = useUser();
  const { addHabit } = useHabits();
  const { toggleLifeAreaEnabled } = useLifeAreas();

  // If user has already completed onboarding, redirect to dashboard
  useEffect(() => {
    if (user?.hasCompletedOnboarding) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [user?.hasCompletedOnboarding, navigate]);

  const handleFinishOnboarding = async () => {
    try {
      // 1. Update user profile with name
      if (temporaryData.userName) {
        updateUserProfile(temporaryData.userName);
      }

      // 2. Enable/disable selected life areas
      if (temporaryData.selectedLifeAreaIds) {
        // Disable all areas first, then enable selected ones
        updateSelectedLifeAreas(temporaryData.selectedLifeAreaIds);

        // Toggle areas based on selection
        // This would be handled by the store/service layer
      }

      // 3. Create habits
      if (temporaryData.createdHabits && temporaryData.createdHabits.length > 0) {
        temporaryData.createdHabits.forEach((habitData) => {
          addHabit({
            id: crypto.randomUUID(),
            name: habitData.name,
            iconName: habitData.iconName,
            xp: habitData.xp,
            points: habitData.xp * 0.5,
            completed: false,
            lifeArea: habitData.lifeArea,
            createdAt: new Date(),
          });
        });
      }

      // 4. Mark onboarding as complete
      completeOnboarding();
      finalizeOnboarding();

      // 5. Navigate to dashboard
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Indicator */}
        <div className="mb-12">
          <OnboardingProgress currentStep={currentStep} completedSteps={completedSteps} />
        </div>

        {/* Step Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {currentStep === ONBOARDING_STEPS.WELCOME && (
            <OnboardingStep1 onNext={nextStep} />
          )}

          {currentStep === ONBOARDING_STEPS.LIFE_AREAS && (
            <OnboardingStep2 onNext={nextStep} onPrev={prevStep} />
          )}

          {currentStep === ONBOARDING_STEPS.HABITS && (
            <OnboardingStep3 onNext={nextStep} onPrev={prevStep} />
          )}

          {currentStep === ONBOARDING_STEPS.TUTORIAL && (
            <OnboardingStep4 onFinish={handleFinishOnboarding} onPrev={prevStep} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
