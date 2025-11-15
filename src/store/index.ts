import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { createUserSlice, UserSlice } from './userSlice';
import { createHabitsSlice, HabitsSlice } from './habitsSlice';
import { createStreaksSlice, StreaksSlice } from './streaksSlice';
import { createShopSlice, ShopSlice } from './shopSlice';
import { createChatSlice, ChatSlice } from './chatSlice';
import { createLifeAreasSlice, LifeAreasSlice } from './lifeAreasSlice';
import { createOnboardingSlice, OnboardingSlice } from './onboardingSlice';

// Combined store type
type AppStore = UserSlice &
  HabitsSlice &
  StreaksSlice &
  ShopSlice &
  ChatSlice &
  LifeAreasSlice &
  OnboardingSlice;

// Create the store with all slices
export const useAppStore = create<AppStore>()((...a) => ({
  ...createUserSlice(...a),
  ...createHabitsSlice(...a),
  ...createStreaksSlice(...a),
  ...createShopSlice(...a),
  ...createChatSlice(...a),
  ...createLifeAreasSlice(...a),
  ...createOnboardingSlice(...a),
}));

// Typed hooks for easier access
export function useUser() {
  const selector = useShallow((state: AppStore) => ({
    user: state.user,
    isInitialized: state.isInitialized,
    isLoading: state.isLoading,
    error: state.error,
    initializeUser: state.initializeUser,
    updatePoints: state.updatePoints,
    updateXP: state.updateXP,
    setUser: state.setUser,
    completeOnboarding: state.completeOnboarding,
    updateUserProfile: state.updateUserProfile,
    updateSelectedLifeAreas: state.updateSelectedLifeAreas,
  }));
  return useAppStore(selector);
}

export function useHabits() {
  const selector = useShallow((state: AppStore) => ({
    habits: state.habits,
    isLoading: state.isLoading,
    error: state.error,
    loadHabits: state.loadHabits,
    addHabit: state.addHabit,
    updateHabit: state.updateHabit,
    deleteHabit: state.deleteHabit,
    completeHabit: state.completeHabit,
    uncompleteHabit: state.uncompleteHabit,
    getTotalXPEarned: state.getTotalXPEarned,
  }));
  return useAppStore(selector);
}

export function useStreaks() {
  const selector = useShallow((state: AppStore) => ({
    streak: state.streak,
    isLoading: state.isLoading,
    error: state.error,
    loadStreak: state.loadStreak,
    updateStreakForToday: state.updateStreakForToday,
    getStreakBonus: state.getStreakBonus,
  }));
  return useAppStore(selector);
}

export function useShop() {
  const selector = useShallow((state: AppStore) => ({
    // Purchase history
    purchaseHistory: state.purchaseHistory,
    isLoading: state.isLoading,
    error: state.error,
    loadPurchaseHistory: state.loadPurchaseHistory,
    purchaseItem: state.purchaseItem,
    getTotalSpent: state.getTotalSpent,
    clearHistory: state.clearHistory,
    // Shop items
    shopItems: state.shopItems,
    loadShopItems: state.loadShopItems,
    addShopItem: state.addShopItem,
    updateShopItem: state.updateShopItem,
    deleteShopItem: state.deleteShopItem,
    getShopItemById: state.getShopItemById,
  }));
  return useAppStore(selector);
}

export function useChat() {
  const selector = useShallow((state: AppStore) => ({
    messages: state.messages,
    isLoading: state.isLoading,
    addMessage: state.addMessage,
    setLoading: state.setLoading,
    clearMessages: state.clearMessages,
  }));
  return useAppStore(selector);
}

export function useLifeAreas() {
  const selector = useShallow((state: AppStore) => ({
    lifeAreas: state.lifeAreas,
    lifeAreasInitialized: state.lifeAreasInitialized,
    lifeAreasLoading: state.lifeAreasLoading,
    lifeAreasError: state.lifeAreasError,
    initializeLifeAreas: state.initializeLifeAreas,
    loadLifeAreas: state.loadLifeAreas,
    getLifeArea: state.getLifeArea,
    getLifeAreaById: state.getLifeAreaById,
    refreshLifeAreas: state.refreshLifeAreas,
    addCustomLifeArea: state.addCustomLifeArea,
    updateLifeArea: state.updateLifeArea,
    deleteLifeArea: state.deleteLifeArea,
    toggleLifeAreaEnabled: state.toggleLifeAreaEnabled,
    addXPToLifeArea: state.addXPToLifeArea,
  }));
  return useAppStore(selector);
}

export function useOnboarding() {
  const selector = useShallow((state: AppStore) => ({
    currentStep: state.currentStep,
    completedSteps: state.completedSteps,
    isOnboardingComplete: state.isOnboardingComplete,
    temporaryData: state.temporaryData,
    nextStep: state.nextStep,
    prevStep: state.prevStep,
    goToStep: state.goToStep,
    saveStepData: state.saveStepData,
    completeStep: state.completeStep,
    resetOnboarding: state.resetOnboarding,
    finalizeOnboarding: state.finalizeOnboarding,
  }));
  return useAppStore(selector);
}

// Initialize store on app load
export async function initializeStore() {
  try {
    const state = useAppStore.getState();

    // Initialize in parallel for better performance
    await Promise.all([
      state.initializeUser(),
      state.loadHabits(),
      state.loadStreak(),
      state.loadPurchaseHistory(),
      state.loadShopItems(),
      state.initializeLifeAreas(),
    ]);

    console.log('Store initialized successfully');
  } catch (error) {
    console.error('Error initializing store:', error);
  }
}
