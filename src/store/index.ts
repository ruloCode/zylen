import { create } from 'zustand';
import { createUserSlice, UserSlice } from './userSlice';
import { createHabitsSlice, HabitsSlice } from './habitsSlice';
import { createStreaksSlice, StreaksSlice } from './streaksSlice';
import { createShopSlice, ShopSlice } from './shopSlice';
import { createChatSlice, ChatSlice } from './chatSlice';

// Combined store type
type AppStore = UserSlice & HabitsSlice & StreaksSlice & ShopSlice & ChatSlice;

// Create the store with all slices
export const useAppStore = create<AppStore>()((...a) => ({
  ...createUserSlice(...a),
  ...createHabitsSlice(...a),
  ...createStreaksSlice(...a),
  ...createShopSlice(...a),
  ...createChatSlice(...a),
}));

// Typed hooks for easier access
export const useUser = () => useAppStore((state) => ({
  user: state.user,
  isInitialized: state.isInitialized,
  initializeUser: state.initializeUser,
  updatePoints: state.updatePoints,
  updateXP: state.updateXP,
  setUser: state.setUser,
}));

export const useHabits = () => useAppStore((state) => ({
  habits: state.habits,
  loadHabits: state.loadHabits,
  addHabit: state.addHabit,
  updateHabit: state.updateHabit,
  deleteHabit: state.deleteHabit,
  toggleHabit: state.toggleHabit,
  resetDailyHabits: state.resetDailyHabits,
  getTotalXPEarned: state.getTotalXPEarned,
}));

export const useStreaks = () => useAppStore((state) => ({
  streak: state.streak,
  loadStreak: state.loadStreak,
  updateStreakForToday: state.updateStreakForToday,
  getStreakBonus: state.getStreakBonus,
}));

export const useShop = () => useAppStore((state) => ({
  purchaseHistory: state.purchaseHistory,
  loadPurchaseHistory: state.loadPurchaseHistory,
  purchaseItem: state.purchaseItem,
  getTotalSpent: state.getTotalSpent,
  clearHistory: state.clearHistory,
}));

export const useChat = () => useAppStore((state) => ({
  messages: state.messages,
  isLoading: state.isLoading,
  addMessage: state.addMessage,
  setLoading: state.setLoading,
  clearMessages: state.clearMessages,
}));

// Initialize store on app load
export function initializeStore() {
  useAppStore.getState().initializeUser();
  useAppStore.getState().loadHabits();
  useAppStore.getState().loadStreak();
  useAppStore.getState().loadPurchaseHistory();
}
