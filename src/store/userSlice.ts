import { StateCreator } from 'zustand';
import { User } from '@/types';
import { UserService } from '@/services';
import {
  getLevelFromXP,
  calculateGlobalLevelUpReward,
  calculatePointsFromXP,
} from '@/utils/xp';

export interface UserSlice {
  user: User | null;
  isInitialized: boolean;

  // Actions
  initializeUser: () => void;
  updatePoints: (delta: number) => void;
  updateXP: (xp: number) => void;
  setUser: (user: User) => void;
  completeOnboarding: () => void;
  updateUserProfile: (name: string, avatarUrl?: string) => void;
  updateSelectedLifeAreas: (areaIds: string[]) => void;
}

export const createUserSlice: StateCreator<UserSlice> = (set) => ({
  user: null,
  isInitialized: false,

  initializeUser: () => {
    const existingUser = UserService.getUser();
    if (existingUser) {
      // Migration: Add level if it doesn't exist
      if (existingUser.level === undefined) {
        existingUser.level = getLevelFromXP(existingUser.totalXPEarned);
        UserService.setUser(existingUser);
      }
      set({ user: existingUser, isInitialized: true });
    } else {
      const newUser = UserService.initializeUser();
      set({ user: newUser, isInitialized: true });
    }
  },

  updatePoints: (delta: number) => {
    set((state) => {
      if (!state.user) return state;

      const updatedUser = {
        ...state.user,
        points: state.user.points + delta,
      };

      UserService.setUser(updatedUser);
      return { user: updatedUser };
    });
  },

  updateXP: (xp: number) => {
    set((state) => {
      if (!state.user) return state;

      const oldLevel = state.user.level;
      const newTotalXP = state.user.totalXPEarned + xp;
      const newLevel = getLevelFromXP(newTotalXP);

      // Calculate points earned from XP (separate from level up rewards)
      const pointsEarned = calculatePointsFromXP(xp);

      // Check if user leveled up
      let levelUpBonus = 0;
      if (newLevel > oldLevel) {
        // Award bonus points for each level gained
        for (let level = oldLevel + 1; level <= newLevel; level++) {
          levelUpBonus += calculateGlobalLevelUpReward(level);
        }
      }

      const updatedUser = {
        ...state.user,
        totalXPEarned: newTotalXP,
        level: newLevel,
        points: state.user.points + pointsEarned + levelUpBonus,
      };

      UserService.setUser(updatedUser);
      return { user: updatedUser };
    });
  },

  setUser: (user: User) => {
    UserService.setUser(user);
    set({ user });
  },

  completeOnboarding: () => {
    set((state) => {
      if (!state.user) return state;

      const updatedUser = {
        ...state.user,
        hasCompletedOnboarding: true,
      };

      UserService.setUser(updatedUser);
      return { user: updatedUser };
    });
  },

  updateUserProfile: (name: string, avatarUrl?: string) => {
    set((state) => {
      if (!state.user) return state;

      const updatedUser = {
        ...state.user,
        name,
        ...(avatarUrl !== undefined && { avatarUrl }),
      };

      UserService.setUser(updatedUser);
      return { user: updatedUser };
    });
  },

  updateSelectedLifeAreas: (areaIds: string[]) => {
    set((state) => {
      if (!state.user) return state;

      const updatedUser = {
        ...state.user,
        selectedLifeAreas: areaIds,
      };

      UserService.setUser(updatedUser);
      return { user: updatedUser };
    });
  },
});
