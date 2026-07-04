import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { createUserSlice } from './userSlice';
import { createHabitsSlice } from './habitsSlice';
import { createStreaksSlice } from './streaksSlice';
import { createShopSlice } from './shopSlice';
import { createChatSlice } from './chatSlice';
import { createLifeAreasSlice } from './lifeAreasSlice';
import { createOnboardingSlice } from './onboardingSlice';
import { createSocialSlice } from './socialSlice';
import { createLeaderboardSlice } from './leaderboardSlice';
import { createRootHabitSlice } from './rootHabitSlice';
import { createAchievementsSlice } from './achievementsSlice';
import { createHabitTemplatesSlice } from './habitTemplatesSlice';
import { createThemeSlice } from './themeSlice';
import { createArenaSlice } from './arenaSlice';
import { createFocusSlice } from './focusSlice';
import { createGuardianSlice } from './guardianSlice';
import { AVATARS, LIFE_AREAS } from '@/constants';
import type { LifeArea, Streak, User } from '@/types';
import type { HabitWithCompletion } from '@/services/supabase/habits.service';
import type { AppStore } from './types';

export type { AppStore } from './types';

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
  ...createThemeSlice(...a),
  ...createArenaSlice(...a),
  ...createFocusSlice(...a),
  ...createGuardianSlice(...a),
}));

// Typed hooks for easier access
export function useUser() {
  const selector = useShallow((state: AppStore) => ({
    user: state.user,
    isInitialized: state.isInitialized,
    isLoading: state.userLoading,
    error: state.userError,
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
    isLoading: state.habitsLoading,
    error: state.habitsError,
    loadHabits: state.loadHabits,
    addHabit: state.addHabit,
    updateHabit: state.updateHabit,
    deleteHabit: state.deleteHabit,
    completeHabit: state.completeHabit,
    uncompleteHabit: state.uncompleteHabit,
    recordRelapse: state.recordRelapse,
    getTotalXPEarned: state.getTotalXPEarned,
    getHabitHistory: state.getHabitHistory,
  }));
  return useAppStore(selector);
}

export function useStreaks() {
  const selector = useShallow((state: AppStore) => ({
    streak: state.streak,
    isLoading: state.streakLoading,
    error: state.streakError,
    loadStreak: state.loadStreak,
    refreshStreak: state.refreshStreak,
    updateStreakForToday: state.updateStreakForToday,
    getStreakBonus: state.getStreakBonus,
  }));
  return useAppStore(selector);
}

export function useShop() {
  const selector = useShallow((state: AppStore) => ({
    // Purchase history
    purchaseHistory: state.purchaseHistory,
    isLoading: state.shopLoading,
    error: state.shopError,
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
    isLoading: state.chatLoading,
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
    isLoading: state.socialLoading,
    error: state.socialError,
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
    isLoading: state.leaderboardLoading,
    error: state.leaderboardError,
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
    isLoading: state.rootHabitLoading,
    error: state.rootHabitError,
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
    isLoading: state.achievementsLoading,
    error: state.achievementsError,
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

export function useTheme() {
  const selector = useShallow((state: AppStore) => ({
    theme: state.theme,
    setTheme: state.setTheme,
    loadTheme: state.loadTheme,
  }));
  return useAppStore(selector);
}

export function useArena() {
  const selector = useShallow((state: AppStore) => ({
    arenaProgress: state.arenaProgress,
    arenaLoading: state.arenaLoading,
    arenaError: state.arenaError,
    loadArenaProgress: state.loadArenaProgress,
    purchaseArenaItem: state.purchaseArenaItem,
    equipArenaGear: state.equipArenaGear,
    completeArenaTier: state.completeArenaTier,
  }));
  return useAppStore(selector);
}

export function useFocus() {
  const selector = useShallow((state: AppStore) => ({
    focusGems: state.focusGems,
    focusSpecies: state.focusSpecies,
    focusStats: state.focusStats,
    activeFocusSession: state.activeFocusSession,
    isLoading: state.focusLoading,
    error: state.focusError,
    loadFocusData: state.loadFocusData,
    createFocusGem: state.createFocusGem,
    archiveFocusGem: state.archiveFocusGem,
    unlockFocusSpecies: state.unlockFocusSpecies,
    startFocusSession: state.startFocusSession,
    completeFocusSession: state.completeFocusSession,
    breakFocusSession: state.breakFocusSession,
    setActiveFocusSession: state.setActiveFocusSession,
    updateFocusPause: state.updateFocusPause,
  }));
  return useAppStore(selector);
}

const shouldSkipAuth =
  import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true';

function getDevUser(): User {
  return {
    id: 'local-dev-user',
    name: 'Camilo',
    username: 'localdev',
    points: 250,
    totalXPEarned: 838,
    level: 8,
    joinedAt: new Date(),
    avatarUrl: AVATARS.DANI,
    hasCompletedOnboarding: true,
    selectedLifeAreas: LIFE_AREAS.map((area) => area.toLowerCase()),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota',
    gender: 'female',
    ageRange: '25-34',
    experienceLevel: 'intermediate',
    motivation: 'wellbeing',
  };
}

function getDevHabits(): HabitWithCompletion[] {
  return [
    {
      id: 'dev-meditation', name: 'Meditación', iconName: 'Sprout', xp: 20, points: 10,
      lifeArea: 'health', habitType: 'check', unit: 'min', dailyGoal: 10,
      color: '#4CAF50', completedToday: true,
    },
    {
      id: 'dev-training', name: 'Entrenamiento', iconName: 'Dumbbell', xp: 30, points: 15,
      lifeArea: 'health', habitType: 'measurable', unit: 'min', dailyGoal: 30,
      todayValue: 15, color: '#8757DB', completedToday: false,
    },
    {
      id: 'dev-reading', name: 'Lectura', iconName: 'Book', xp: 20, points: 10,
      lifeArea: 'creativity', habitType: 'measurable', unit: 'min', dailyGoal: 20,
      todayValue: 0, color: '#E1AB3D', completedToday: false,
    },
  ];
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
    currentStreak: 12,
    weeklyStreak: 4,
    longestStreak: 20,
    lastSevenDays: [true, true, true, true, true, true, true],
  };
}

// Initialize store on app load
export async function initializeStore() {
  try {
    const state = useAppStore.getState();

    // Theme is a UI preference (localStorage) — load it regardless of auth state.
    state.loadTheme();

    if (shouldSkipAuth) {
      useAppStore.setState({
        user: getDevUser(),
        isInitialized: true,
        userLoading: false,
        userError: null,
        habits: getDevHabits(),
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
