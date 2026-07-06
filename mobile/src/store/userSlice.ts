import { StateCreator } from 'zustand';
import { User } from '@/types';
import { UserService } from '@/services/supabase/user.service';
import { LifeAreasService } from '@/services/supabase/lifeAreas.service';

export interface UserSlice {
  user: User | null;
  isInitialized: boolean;
  userLoading: boolean;
  userError: string | null;

  // Actions
  initializeUser: () => Promise<void>;
  updatePoints: (delta: number) => Promise<void>;
  updateXP: (xp: number) => Promise<void>;
  setUser: (user: User) => void;
  completeOnboarding: () => Promise<void>;
  updateUserProfile: (
    name: string,
    avatarUrl?: string,
    extra?: Partial<Pick<User, 'gender' | 'ageRange' | 'experienceLevel' | 'motivation'>>
  ) => Promise<void>;
  updateSelectedLifeAreas: (areaIds: string[]) => Promise<void>;
}

export const createUserSlice: StateCreator<UserSlice> = (set, get) => ({
  user: null,
  isInitialized: false,
  userLoading: false,
  userError: null,

  initializeUser: async () => {
    try {
      set({ userLoading: true, userError: null });

      const user = await UserService.getUser();

      if (user) {
        // Sync timezone with browser automatically
        try {
          const updatedUser = await UserService.syncTimezone();
          set({ user: updatedUser, isInitialized: true, userLoading: false });
        } catch (tzError) {
          // If timezone sync fails, still initialize with the user we have
          console.warn('Failed to sync timezone, continuing with existing user:', tzError);
          set({ user, isInitialized: true, userLoading: false });
        }
      } else {
        // User not found - shouldn't happen if trigger works
        console.warn('User not found after authentication');
        set({ isInitialized: true, userLoading: false });
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      set({
        userError: error instanceof Error ? error.message : 'Failed to initialize user',
        userLoading: false,
        isInitialized: true,
      });
    }
  },

  updatePoints: async (delta: number) => {
    try {
      const currentUser = get().user;
      if (!currentUser) return;

      set({ userLoading: true, userError: null });

      const newPoints = await UserService.updatePoints(delta);

      set((state) => ({
        user: state.user ? { ...state.user, points: newPoints } : null,
        userLoading: false,
      }));
    } catch (error) {
      console.error('Error updating points:', error);
      set({
        userError: error instanceof Error ? error.message : 'Failed to update points',
        userLoading: false,
      });
    }
  },

  updateXP: async (xp: number) => {
    try {
      const currentUser = get().user;
      if (!currentUser) return;

      set({ userLoading: true, userError: null });

      const result = await UserService.updateXP(xp);

      set((state) => ({
        user: state.user
          ? {
              ...state.user,
              totalXPEarned: result.totalXP,
              level: result.level,
            }
          : null,
        userLoading: false,
      }));
    } catch (error) {
      console.error('Error updating XP:', error);
      set({
        userError: error instanceof Error ? error.message : 'Failed to update XP',
        userLoading: false,
      });
    }
  },

  setUser: (user: User) => {
    set({ user });
  },

  completeOnboarding: async () => {
    try {
      const currentUser = get().user;
      if (!currentUser) return;

      set({ userLoading: true, userError: null });

      await UserService.updateUser({ hasCompletedOnboarding: true });

      set((state) => ({
        user: state.user
          ? { ...state.user, hasCompletedOnboarding: true }
          : null,
        userLoading: false,
      }));
    } catch (error) {
      console.error('Error completing onboarding:', error);
      set({
        userError: error instanceof Error ? error.message : 'Failed to complete onboarding',
        userLoading: false,
      });
    }
  },

  updateUserProfile: async (name, avatarUrl, extra) => {
    try {
      const currentUser = get().user;
      if (!currentUser) return;

      set({ userLoading: true, userError: null });

      const updates: Partial<User> = { name, ...extra };
      if (avatarUrl !== undefined) {
        updates.avatarUrl = avatarUrl;
      }

      const updatedUser = await UserService.updateUser(updates);

      set({ user: updatedUser, userLoading: false });
    } catch (error) {
      console.error('Error updating user profile:', error);
      set({
        userError: error instanceof Error ? error.message : 'Failed to update profile',
        userLoading: false,
      });
    }
  },

  updateSelectedLifeAreas: async (areaIds: string[]) => {
    try {
      const currentUser = get().user;
      if (!currentUser) return;

      set({ userLoading: true, userError: null });

      // Enable/disable life areas based on selection
      const allAreas = await LifeAreasService.getLifeAreas();

      // Update each area's enabled status
      await Promise.all(
        allAreas.map(async (area) => {
          const shouldBeEnabled = areaIds.includes(area.id);
          if (area.enabled !== shouldBeEnabled) {
            await LifeAreasService.updateLifeArea(area.id, { enabled: shouldBeEnabled });
          }
        })
      );

      set((state) => ({
        user: state.user
          ? { ...state.user, selectedLifeAreas: areaIds }
          : null,
        userLoading: false,
      }));
    } catch (error) {
      console.error('Error updating selected life areas:', error);
      set({
        userError: error instanceof Error ? error.message : 'Failed to update life areas',
        userLoading: false,
      });
    }
  },
});
