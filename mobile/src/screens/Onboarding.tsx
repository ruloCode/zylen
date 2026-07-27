import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import toast from '@/lib/toast';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useOnboarding, useUser } from '@/store';
import { ROUTES } from '@/constants/routes';
import { ONBOARDING_STEPS } from '@/types';
import type { OnboardingData } from '@/types';
import {
  OnboardingCarousel,
  OnboardingStep1,
  OnboardingStepMotivation,
  OnboardingStepTimeOfDay,
  OnboardingStepFirstHabit,
  OnboardingStepPayoff,
  OnboardingStepNotifications,
} from '@/features/onboarding/components';
import { useLocale } from '@/hooks/useLocale';

/**
 * Onboarding Page — React Native port, retention-first flow.
 *
 * Steps (see ONBOARDING_STEPS):
 *   HERO → MOTIVATION → TIME_OF_DAY → FIRST_HABIT → PAYOFF → NOTIFICATIONS
 *
 * The payoff step creates AND completes the chosen habit through the real
 * complete_habit RPC, so the player reaches Home with their first Luz already
 * earned. The in-progress state is persisted locally and rehydrated, so a
 * killed app resumes at the first step whose prerequisites are met.
 *
 * Like the web's OnboardingEntry: unauthenticated visitors (arriving from the
 * Welcome splash) see the pre-auth marketing carousel instead; once they sign
 * up/in, this same route renders the multi-step flow.
 */

/** Earliest step whose prerequisites are missing (guards rehydrated state). */
function firstIncompleteStep(step: number, data: OnboardingData): number {
  if (step > ONBOARDING_STEPS.HERO && (!data.userName || !data.gender)) {
    return ONBOARDING_STEPS.HERO;
  }
  if (step > ONBOARDING_STEPS.MOTIVATION && !data.motivation) {
    return ONBOARDING_STEPS.MOTIVATION;
  }
  if (step > ONBOARDING_STEPS.TIME_OF_DAY && !data.preferredTimeOfDay) {
    return ONBOARDING_STEPS.TIME_OF_DAY;
  }
  if (step > ONBOARDING_STEPS.FIRST_HABIT && !data.firstHabit) {
    return ONBOARDING_STEPS.FIRST_HABIT;
  }
  return step;
}

export function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { user: authUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    currentStep,
    temporaryData,
    userId: boundUserId,
    nextStep,
    prevStep,
    goToStep,
    finalizeOnboarding,
    hydrateForUser,
  } = useOnboarding();
  const { user, completeOnboarding } = useUser();

  // Bind the persisted in-progress flow to this account (resets it if another
  // account left one behind on this device).
  useEffect(() => {
    if (authUser?.id) {
      hydrateForUser(authUser.id);
    }
  }, [authUser?.id, hydrateForUser]);

  // If user has already completed onboarding, redirect to dashboard
  useEffect(() => {
    if (user?.hasCompletedOnboarding) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user?.hasCompletedOnboarding, router]);

  // Never sit on a rehydrated step whose data is missing.
  useEffect(() => {
    const target = firstIncompleteStep(currentStep, temporaryData);
    if (target < currentStep) {
      goToStep(target);
    }
  }, [currentStep, temporaryData, goToStep]);

  const handleFinishOnboarding = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);

      // Profile/habit writes already happened at the payoff step — here we
      // only flip the completion flag (completeOnboarding now throws on
      // failure, so a broken UPDATE can't silently bounce-loop the user).
      await completeOnboarding();
      finalizeOnboarding();

      // Pass the just-selected gender explicitly: the component's `t` still
      // holds the pre-onboarding gender context.
      const genderCtx =
        temporaryData.gender === 'female' || temporaryData.gender === 'male'
          ? temporaryData.gender
          : undefined;
      toast.success(t('onboarding.completedSuccess', { context: genderCtx }));

      router.replace(ROUTES.DASHBOARD);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error(t('errors.onboardingFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unauthenticated: pre-auth marketing carousel (web: OnboardingEntry)
  if (!authUser) {
    return <OnboardingCarousel />;
  }

  // Don't paint step 0 for a frame while hydrateForUser restores a resumed flow.
  if (boundUserId !== authUser.id) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <View
        className="flex-1"
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 16,
        }}
      >
        <View className="mx-auto w-full max-w-md flex-1">
          {currentStep === ONBOARDING_STEPS.HERO && <OnboardingStep1 onNext={nextStep} />}

          {currentStep === ONBOARDING_STEPS.MOTIVATION && (
            <OnboardingStepMotivation onNext={nextStep} onPrev={prevStep} />
          )}

          {currentStep === ONBOARDING_STEPS.TIME_OF_DAY && (
            <OnboardingStepTimeOfDay onNext={nextStep} onPrev={prevStep} />
          )}

          {currentStep === ONBOARDING_STEPS.FIRST_HABIT && (
            <OnboardingStepFirstHabit onNext={nextStep} onPrev={prevStep} />
          )}

          {currentStep === ONBOARDING_STEPS.PAYOFF && (
            <OnboardingStepPayoff onNext={nextStep} onPrev={prevStep} />
          )}

          {currentStep === ONBOARDING_STEPS.NOTIFICATIONS && (
            <OnboardingStepNotifications
              onFinish={handleFinishOnboarding}
              isSubmitting={isSubmitting}
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default Onboarding;
