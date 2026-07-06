import { StateCreator } from 'zustand';
import { OnboardingState, OnboardingData, TOTAL_ONBOARDING_STEPS } from '@/types';
import { OnboardingService } from '@/services/onboarding.service';

export interface OnboardingSlice extends OnboardingState {
  // Actions
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  saveStepData: (data: Partial<OnboardingData>) => void;
  completeStep: (step: number) => void;
  resetOnboarding: () => void;
  finalizeOnboarding: () => void;
}

export const createOnboardingSlice: StateCreator<OnboardingSlice> = (set, get) => ({
  currentStep: 0,
  completedSteps: [],
  isOnboardingComplete: false,
  temporaryData: {},

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < TOTAL_ONBOARDING_STEPS - 1) {
      const newStep = currentStep + 1;
      set({ currentStep: newStep });
      OnboardingService.saveOnboardingState({
        ...get(),
        currentStep: newStep,
      });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      set({ currentStep: newStep });
      OnboardingService.saveOnboardingState({
        ...get(),
        currentStep: newStep,
      });
    }
  },

  goToStep: (step: number) => {
    if (step >= 0 && step < TOTAL_ONBOARDING_STEPS) {
      set({ currentStep: step });
      OnboardingService.saveOnboardingState({
        ...get(),
        currentStep: step,
      });
    }
  },

  saveStepData: (data: Partial<OnboardingData>) => {
    set((state) => ({
      temporaryData: {
        ...state.temporaryData,
        ...data,
      },
    }));
    OnboardingService.saveOnboardingState({
      ...get(),
      temporaryData: {
        ...get().temporaryData,
        ...data,
      },
    });
  },

  completeStep: (step: number) => {
    set((state) => {
      const completedSteps = state.completedSteps.includes(step)
        ? state.completedSteps
        : [...state.completedSteps, step];

      OnboardingService.saveOnboardingState({
        ...state,
        completedSteps,
      });

      return { completedSteps };
    });
  },

  resetOnboarding: () => {
    const initialState = {
      currentStep: 0,
      completedSteps: [],
      isOnboardingComplete: false,
      temporaryData: {},
    };
    set(initialState);
    OnboardingService.clearOnboardingState();
  },

  finalizeOnboarding: () => {
    set({ isOnboardingComplete: true });
    OnboardingService.clearOnboardingState();
  },
});
