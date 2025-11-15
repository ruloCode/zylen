import { OnboardingState } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { StorageService } from './storage';

/**
 * Onboarding data service
 * Manages temporary onboarding state during the flow
 */
export class OnboardingService {
  /**
   * Get onboarding state
   */
  static getOnboardingState(): OnboardingState | null {
    return StorageService.get<OnboardingState>(STORAGE_KEYS.APP_STATE);
  }

  /**
   * Save onboarding state
   */
  static saveOnboardingState(state: OnboardingState): boolean {
    return StorageService.set(STORAGE_KEYS.APP_STATE, state);
  }

  /**
   * Clear onboarding state (after completion)
   */
  static clearOnboardingState(): boolean {
    return StorageService.remove(STORAGE_KEYS.APP_STATE);
  }

  /**
   * Check if onboarding is in progress
   */
  static isOnboardingInProgress(): boolean {
    const state = this.getOnboardingState();
    return state !== null && !state.isOnboardingComplete;
  }
}
