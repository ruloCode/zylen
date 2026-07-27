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
  /** Bind the in-progress state to a user; resets it if another account owned it. */
  hydrateForUser: (userId: string) => void;
}

/** Only the serializable onboarding fields — never the whole combined store. */
function pickOnboardingState(state: OnboardingState): OnboardingState {
  return {
    currentStep: state.currentStep,
    completedSteps: state.completedSteps,
    isOnboardingComplete: state.isOnboardingComplete,
    temporaryData: state.temporaryData,
    userId: state.userId,
  };
}

const INITIAL_STATE: OnboardingState = {
  currentStep: 0,
  completedSteps: [],
  isOnboardingComplete: false,
  temporaryData: {},
  userId: undefined,
};

/**
 * Read a sane in-progress onboarding from storage. Completed or malformed
 * states fall back to a fresh flow. NOTE: must run AFTER kv.hydrate() (the
 * store itself is created at module import, before the mirror is ready), so
 * it is called from hydrateForUser — not from the slice's initial state.
 */
function loadPersistedState(): OnboardingState {
  try {
    const saved = OnboardingService.getOnboardingState();
    if (!saved || saved.isOnboardingComplete) return INITIAL_STATE;
    const step = typeof saved.currentStep === 'number' ? saved.currentStep : 0;
    return {
      currentStep: Math.min(Math.max(step, 0), TOTAL_ONBOARDING_STEPS - 1),
      completedSteps: Array.isArray(saved.completedSteps) ? saved.completedSteps : [],
      isOnboardingComplete: false,
      temporaryData: saved.temporaryData ?? {},
      userId: saved.userId,
    };
  } catch {
    return INITIAL_STATE;
  }
}

export const createOnboardingSlice: StateCreator<OnboardingSlice> = (set, get) => ({
  ...INITIAL_STATE,

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < TOTAL_ONBOARDING_STEPS - 1) {
      set({ currentStep: currentStep + 1 });
      OnboardingService.saveOnboardingState(pickOnboardingState(get()));
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
      OnboardingService.saveOnboardingState(pickOnboardingState(get()));
    }
  },

  goToStep: (step: number) => {
    if (step >= 0 && step < TOTAL_ONBOARDING_STEPS) {
      set({ currentStep: step });
      OnboardingService.saveOnboardingState(pickOnboardingState(get()));
    }
  },

  saveStepData: (data: Partial<OnboardingData>) => {
    set((state) => ({
      temporaryData: {
        ...state.temporaryData,
        ...data,
      },
    }));
    OnboardingService.saveOnboardingState(pickOnboardingState(get()));
  },

  completeStep: (step: number) => {
    set((state) => ({
      completedSteps: state.completedSteps.includes(step)
        ? state.completedSteps
        : [...state.completedSteps, step],
    }));
    OnboardingService.saveOnboardingState(pickOnboardingState(get()));
  },

  resetOnboarding: () => {
    set({ ...INITIAL_STATE });
    OnboardingService.clearOnboardingState();
  },

  finalizeOnboarding: () => {
    set({ isOnboardingComplete: true });
    OnboardingService.clearOnboardingState();
  },

  hydrateForUser: (userId: string) => {
    if (get().userId === userId) {
      return; // Already hydrated for this user — in-memory state wins.
    }
    const persisted = loadPersistedState();
    if (persisted.userId && persisted.userId !== userId) {
      // Another account left an in-progress flow on this device: drop it.
      set({ ...INITIAL_STATE, userId });
    } else {
      // Resume where this (or an anonymous pre-bind) flow left off.
      set({ ...persisted, userId });
    }
    OnboardingService.saveOnboardingState(pickOnboardingState(get()));
  },
});
