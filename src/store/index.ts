import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { createUserSlice, UserSlice } from './userSlice';
import { createHabitsSlice, HabitsSlice } from './habitsSlice';
import { createStreaksSlice, StreaksSlice } from './streaksSlice';
import { createShopSlice, ShopSlice } from './shopSlice';
import { createChatSlice, ChatSlice } from './chatSlice';
import { createLifeAreasSlice, LifeAreasSlice } from './lifeAreasSlice';
import { createOnboardingSlice, OnboardingSlice } from './onboardingSlice';
import { createSocialSlice, SocialSlice } from './socialSlice';
import { createLeaderboardSlice, LeaderboardSlice } from './leaderboardSlice';
import { createRootHabitSlice, RootHabitSlice } from './rootHabitSlice';
import { createAchievementsSlice, AchievementsSlice } from './achievementsSlice';
import { createHabitTemplatesSlice, HabitTemplatesSlice } from './habitTemplatesSlice';
import { AVATARS, LIFE_AREAS } from '@/constants';
import type { LifeArea, Streak, User } from '@/types';

// Combined store type
type AppStore = UserSlice &
  HabitsSlice &
  StreaksSlice &
  ShopSlice &
  ChatSlice &
  LifeAreasSlice &
  OnboardingSlice &
  SocialSlice &
  LeaderboardSlice &
  RootHabitSlice &
  AchievementsSlice &
  HabitTemplatesSlice;

// Create the store with all slices
export const useAppStore = create<AppStore>()((...a) => ({
  ...createUserSlice(...a),
  ...createHabitsSlice(...a),
  ...createStreaksSlice(...a),
  ...createShopSlice(...a),
  ...createChatSlice(...a),
  ...createLifeAreasSlice(...a),
  ...createOnboardingSlice(...a),
  ...createSocialSlice(...a),
  ...createLeaderboardSlice(...a),
  ...createRootHabitSlice(...a),
  ...createAchievementsSlice(...a),
  ...createHabitTemplatesSlice(...a),
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
    getHabitHistory: state.getHabitHistory,
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

export function useSocial() {
  const selector = useShallow((state: AppStore) => ({
    friends: state.friends,
    pendingRequests: state.pendingRequests,
    sentRequests: state.sentRequests,
    searchResults: state.searchResults,
    isLoading: state.isLoading,
    error: state.error,
    searchUsers: state.searchUsers,
    sendFriendRequest: state.sendFriendRequest,
    acceptFriendRequest: state.acceptFriendRequest,
    rejectFriendRequest: state.rejectFriendRequest,
    removeFriend: state.removeFriend,
    loadFriends: state.loadFriends,
    loadPendingRequests: state.loadPendingRequests,
    loadSentRequests: state.loadSentRequests,
    clearSearchResults: state.clearSearchResults,
    clearError: state.clearError,
  }));
  return useAppStore(selector);
}

export function useLeaderboard() {
  const selector = useShallow((state: AppStore) => ({
    weeklyLeaderboard: state.weeklyLeaderboard,
    userRank: state.userRank,
    userWeeklyStats: state.userWeeklyStats,
    isLoading: state.isLoading,
    error: state.error,
    loadWeeklyLeaderboard: state.loadWeeklyLeaderboard,
    loadUserWeeklyStats: state.loadUserWeeklyStats,
    refreshLeaderboard: state.refreshLeaderboard,
    clearError: state.clearError,
  }));
  return useAppStore(selector);
}

export function useRootHabit() {
  const selector = useShallow((state: AppStore) => ({
    progress: state.progress,
    checkIns: state.checkIns,
    isLoading: state.isLoading,
    error: state.error,
    canCheckIn: state.canCheckIn,
    loadProgress: state.loadProgress,
    checkIn: state.checkIn,
    checkInDay: state.checkInDay,
    deleteCheckIn: state.deleteCheckIn,
    resetChallenge: state.resetChallenge,
    refreshCanCheckIn: state.refreshCanCheckIn,
  }));
  return useAppStore(selector);
}

export function useAchievements() {
  const selector = useShallow((state: AppStore) => ({
    achievements: state.achievements,
    userAchievements: state.userAchievements,
    achievementsWithProgress: state.achievementsWithProgress,
    unlockedCount: state.unlockedCount,
    isLoading: state.isLoading,
    error: state.error,
    loadAchievements: state.loadAchievements,
    loadAchievementsWithProgress: state.loadAchievementsWithProgress,
    checkAndUnlockAchievements: state.checkAndUnlockAchievements,
    getAchievementsByCategory: state.getAchievementsByCategory,
    refreshAchievements: state.refreshAchievements,
  }));
  return useAppStore(selector);
}

export function useHabitTemplates() {
  const selector = useShallow((state: AppStore) => ({
    templates: state.templates,
    filteredTemplates: state.filteredTemplates,
    templatesLoading: state.templatesLoading,
    templatesError: state.templatesError,
    selectedLifeArea: state.selectedLifeArea,
    searchQuery: state.searchQuery,
    loadTemplates: state.loadTemplates,
    filterByLifeArea: state.filterByLifeArea,
    setSearchQuery: state.setSearchQuery,
    clearFilters: state.clearFilters,
    getTemplateById: state.getTemplateById,
    incrementTemplatePopularity: state.incrementTemplatePopularity,
  }));
  return useAppStore(selector);
}

const shouldSkipAuth =
  import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true';

function getDevUser(): User {
  return {
    id: 'local-dev-user',
    name: 'Local Dev',
    username: 'localdev',
    points: 250,
    totalXPEarned: 120,
    level: 1,
    joinedAt: new Date(),
    avatarUrl: AVATARS.DANI,
    hasCompletedOnboarding: true,
    selectedLifeAreas: LIFE_AREAS.map((area) => area.toLowerCase()),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota',
  };
}

function getDevLifeAreas(): LifeArea[] {
  return LIFE_AREAS.map((area) => ({
    id: area.toLowerCase(),
    area,
    level: 1,
    totalXP: 0,
    isCustom: false,
    enabled: true,
  }));
}

function getDevStreak(): Streak {
  return {
    currentStreak: 0,
    weeklyStreak: 0,
    longestStreak: 0,
    lastSevenDays: [false, false, false, false, false, false, false],
  };
}

// Initialize store on app load
export async function initializeStore() {
  try {
    const state = useAppStore.getState();

    if (shouldSkipAuth) {
      useAppStore.setState({
        user: getDevUser(),
        isInitialized: true,
        isLoading: false,
        error: null,
        habits: [],
        streak: getDevStreak(),
        purchaseHistory: { purchases: [], totalSpent: 0 },
        shopItems: [],
        lifeAreas: getDevLifeAreas(),
        lifeAreasInitialized: true,
        lifeAreasLoading: false,
        lifeAreasError: null,
      });
      console.log('Store initialized in local auth bypass mode');
      return;
    }

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
