import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { createUserSlice, UserSlice } from './userSlice';
import { createHabitsSlice, HabitsSlice } from './habitsSlice';
import { createStreaksSlice, StreaksSlice } from './streaksSlice';
import { createShopSlice, ShopSlice } from './shopSlice';
import { createChatSlice, ChatSlice } from './chatSlice';
import { createLifeAreasSlice, LifeAreasSlice } from './lifeAreasSlice';

// Combined store type
type AppStore = UserSlice & HabitsSlice & StreaksSlice & ShopSlice & ChatSlice & LifeAreasSlice;

// Create the store with all slices
export const useAppStore = create<AppStore>()((...a) => ({
  ...createUserSlice(...a),
  ...createHabitsSlice(...a),
  ...createStreaksSlice(...a),
  ...createShopSlice(...a),
  ...createChatSlice(...a),
  ...createLifeAreasSlice(...a),
}));

// Typed hooks for easier access
export function useUser() {
  const selector = useShallow((state: AppStore) => ({
    user: state.user,
    isInitialized: state.isInitialized,
    initializeUser: state.initializeUser,
    updatePoints: state.updatePoints,
    updateXP: state.updateXP,
    setUser: state.setUser,
  }));
  return useAppStore(selector);
}

export function useHabits() {
  const selector = useShallow((state: AppStore) => ({
    habits: state.habits,
    loadHabits: state.loadHabits,
    addHabit: state.addHabit,
    updateHabit: state.updateHabit,
    deleteHabit: state.deleteHabit,
    toggleHabit: state.toggleHabit,
    resetDailyHabits: state.resetDailyHabits,
    getTotalXPEarned: state.getTotalXPEarned,
  }));
  return useAppStore(selector);
}

export function useStreaks() {
  const selector = useShallow((state: AppStore) => ({
    streak: state.streak,
    loadStreak: state.loadStreak,
    updateStreakForToday: state.updateStreakForToday,
    getStreakBonus: state.getStreakBonus,
  }));
  return useAppStore(selector);
}

export function useShop() {
  const selector = useShallow((state: AppStore) => ({
    purchaseHistory: state.purchaseHistory,
    loadPurchaseHistory: state.loadPurchaseHistory,
    purchaseItem: state.purchaseItem,
    getTotalSpent: state.getTotalSpent,
    clearHistory: state.clearHistory,
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
    initializeLifeAreas: state.initializeLifeAreas,
    loadLifeAreas: state.loadLifeAreas,
    getLifeArea: state.getLifeArea,
    refreshLifeAreas: state.refreshLifeAreas,
  }));
  return useAppStore(selector);
}

// Initialize store on app load
export function initializeStore() {
  useAppStore.getState().initializeUser();
  useAppStore.getState().loadHabits();
  useAppStore.getState().loadStreak();
  useAppStore.getState().loadPurchaseHistory();
  useAppStore.getState().initializeLifeAreas();
}
