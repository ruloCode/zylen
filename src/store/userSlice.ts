import { StateCreator } from 'zustand';
import { User } from '@/types';
import { UserService } from '@/services';

export interface UserSlice {
  user: User | null;
  isInitialized: boolean;

  // Actions
  initializeUser: () => void;
  updatePoints: (delta: number) => void;
  updateXP: (xp: number) => void;
  setUser: (user: User) => void;
}

export const createUserSlice: StateCreator<UserSlice> = (set) => ({
  user: null,
  isInitialized: false,

  initializeUser: () => {
    const existingUser = UserService.getUser();
    if (existingUser) {
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

      const updatedUser = {
        ...state.user,
        totalXPEarned: state.user.totalXPEarned + xp,
        points: state.user.points + xp, // XP also adds to points
      };

      UserService.setUser(updatedUser);
      return { user: updatedUser };
    });
  },

  setUser: (user: User) => {
    UserService.setUser(user);
    set({ user });
  },
});
