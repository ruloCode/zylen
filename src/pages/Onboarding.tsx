import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useOnboarding, useUser, useHabits, useLifeAreas } from '@/store';
import { ROUTES } from '@/constants/routes';
import { ONBOARDING_STEPS } from '@/types';
import {
  OnboardingProgress,
  OnboardingStep1,
  OnboardingStepUsername,
  OnboardingStep2,
  OnboardingStep3,
  OnboardingStep4,
} from '@/features/onboarding/components';
import { useLocale } from '@/hooks/useLocale';

/**
 * Onboarding Page
 *
 * Multi-step onboarding flow for new users
 * Steps:
 * 1. Welcome + Name + Avatar
 * 2. Choose Username
 * 3. Life Areas Selection
 * 4. Create First Habits
 * 5. Tutorial / Mechanics Overview
 */
export function Onboarding() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setIsSubmitting(true);

      // 1. Update user profile with name and avatar
      if (temporaryData.userName) {
        await updateUserProfile(temporaryData.userName, temporaryData.avatarUrl);
      }

      // 2. Enable/disable selected life areas
      if (temporaryData.selectedLifeAreaIds) {
        await updateSelectedLifeAreas(temporaryData.selectedLifeAreaIds);
      }

      // 3. Create habits - use Promise.all to wait for all habits to be created
      if (temporaryData.createdHabits && temporaryData.createdHabits.length > 0) {
        await Promise.all(
          temporaryData.createdHabits.map((habitData) =>
            addHabit({
              id: crypto.randomUUID(),
              name: habitData.name,
              iconName: habitData.iconName,
              xp: habitData.xp,
              points: habitData.xp * 0.5,
              completed: false,
              lifeArea: habitData.lifeArea,
              createdAt: new Date(),
            })
          )
        );
      }

      // 4. Mark onboarding as complete
      await completeOnboarding();
      finalizeOnboarding();

      // 5. Show success message
      toast.success(t('onboarding.completedSuccess') || '¡Onboarding completado!');

      // 6. Navigate to dashboard
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error(
        t('errors.onboardingFailed') || 'Error al completar el onboarding. Por favor, intenta de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
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

          {currentStep === ONBOARDING_STEPS.USERNAME && (
            <OnboardingStepUsername onNext={nextStep} onPrev={prevStep} />
          )}

          {currentStep === ONBOARDING_STEPS.LIFE_AREAS && (
            <OnboardingStep2 onNext={nextStep} onPrev={prevStep} />
          )}

          {currentStep === ONBOARDING_STEPS.HABITS && (
            <OnboardingStep3 onNext={nextStep} onPrev={prevStep} />
          )}

          {currentStep === ONBOARDING_STEPS.TUTORIAL && (
            <OnboardingStep4
              onFinish={handleFinishOnboarding}
              onPrev={prevStep}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
