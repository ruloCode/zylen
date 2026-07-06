import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import toast from '@/lib/toast';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useOnboarding, useUser, useHabits } from '@/store';
import { ROUTES } from '@/constants/routes';
import { ONBOARDING_STEPS } from '@/types';
import {
  OnboardingCarousel,
  OnboardingProgress,
  OnboardingStep1,
  OnboardingStepAboutYou,
  OnboardingStep2,
  OnboardingStep3,
  OnboardingStep4,
} from '@/features/onboarding/components';
import { useLocale } from '@/hooks/useLocale';

/**
 * Onboarding Page — React Native port.
 *
 * Multi-step onboarding flow for new users
 * Steps:
 * 1. Welcome + Name + Avatar
 * 2. Choose Username
 * 3. Life Areas Selection
 * 4. Create First Habits
 * 5. Tutorial / Mechanics Overview
 *
 * Like the web's OnboardingEntry: unauthenticated visitors (arriving from the
 * Welcome splash) see the pre-auth marketing carousel instead; once they sign
 * up/in, this same route renders the multi-step flow.
 */
export function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { user: authUser } = useAuth();
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

  // If user has already completed onboarding, redirect to dashboard
  useEffect(() => {
    if (user?.hasCompletedOnboarding) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user?.hasCompletedOnboarding, router]);

  const handleFinishOnboarding = async () => {
    try {
      setIsSubmitting(true);

      // 1. Update user profile with name, avatar and identity/personalization data
      if (temporaryData.userName) {
        await updateUserProfile(temporaryData.userName, temporaryData.avatarUrl, {
          gender: temporaryData.gender,
          ageRange: temporaryData.ageRange,
          experienceLevel: temporaryData.experienceLevel,
          motivation: temporaryData.motivation,
        });
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

      // 5. Show success message. Pass the just-selected gender explicitly: the
      // component's `t` still holds the pre-onboarding gender context (no re-render
      // happened between saving the profile and this call), so without this the
      // toast would fall back to the neutral copy.
      const genderCtx =
        temporaryData.gender === 'female' || temporaryData.gender === 'male'
          ? temporaryData.gender
          : undefined;
      toast.success(
        t('onboarding.completedSuccess', { context: genderCtx }) || '¡Onboarding completado!'
      );

      // 6. Navigate to dashboard
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mx-auto w-full max-w-4xl">
          {/* Progress Indicator */}
          <View className="mb-12">
            <OnboardingProgress currentStep={currentStep} completedSteps={completedSteps} />
          </View>

          {/* Step Content */}
          <View>
            {currentStep === ONBOARDING_STEPS.WELCOME && (
              <OnboardingStep1 onNext={nextStep} />
            )}

            {currentStep === ONBOARDING_STEPS.ABOUT_YOU && (
              <OnboardingStepAboutYou onNext={nextStep} onPrev={prevStep} />
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
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default Onboarding;
