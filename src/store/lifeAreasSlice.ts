import { StateCreator } from 'zustand';
import { LifeArea } from '@/types';
import { LifeAreaType } from '@/types/habit';
import { LifeAreasService } from '@/services/supabase/lifeAreas.service';

export interface LifeAreasSlice {
  lifeAreas: LifeArea[];
  lifeAreasInitialized: boolean;
  lifeAreasLoading: boolean;
  lifeAreasError: string | null;

  // Actions
  initializeLifeAreas: () => Promise<void>;
  loadLifeAreas: () => Promise<void>;
  getLifeArea: (area: LifeAreaType) => LifeArea | undefined;
  getLifeAreaById: (id: string) => LifeArea | undefined;
  refreshLifeAreas: () => Promise<void>;
  addCustomLifeArea: (name: string, iconName: string, color: string) => Promise<LifeArea>;
  updateLifeArea: (id: string, updates: Partial<LifeArea>) => Promise<void>;
  deleteLifeArea: (id: string) => Promise<boolean>;
  toggleLifeAreaEnabled: (id: string, enabled: boolean) => Promise<void>;
  addXPToLifeArea: (id: string, xp: number) => Promise<{ newLevel?: number; leveledUp: boolean }>;
}

export const createLifeAreasSlice: StateCreator<LifeAreasSlice> = (set, get) => ({
  lifeAreas: [],
  lifeAreasInitialized: false,
  lifeAreasLoading: false,
  lifeAreasError: null,

  initializeLifeAreas: async () => {
    try {
      set({ lifeAreasLoading: true, lifeAreasError: null });
      const areas = await LifeAreasService.getLifeAreas();
      set({ lifeAreas: areas, lifeAreasInitialized: true, lifeAreasLoading: false });
    } catch (error) {
      console.error('Error initializing life areas:', error);
      set({
        lifeAreasError: error instanceof Error ? error.message : 'Failed to initialize life areas',
        lifeAreasLoading: false
      });
    }
  },

  loadLifeAreas: async () => {
    try {
      set({ lifeAreasLoading: true, lifeAreasError: null });
      const areas = await LifeAreasService.getLifeAreas();
      set({ lifeAreas: areas, lifeAreasLoading: false });
    } catch (error) {
      console.error('Error loading life areas:', error);
      set({
        lifeAreasError: error instanceof Error ? error.message : 'Failed to load life areas',
        lifeAreasLoading: false
      });
    }
  },

  getLifeArea: (area: LifeAreaType) => {
    return get().lifeAreas.find((a) => a.area === area);
  },

  getLifeAreaById: (id: string) => {
    return get().lifeAreas.find((a) => a.id === id);
  },

  refreshLifeAreas: async () => {
    try {
      set({ lifeAreasLoading: true, lifeAreasError: null });
      const areas = await LifeAreasService.getLifeAreas();
      set({ lifeAreas: areas, lifeAreasLoading: false });
    } catch (error) {
      console.error('Error refreshing life areas:', error);
      set({
        lifeAreasError: error instanceof Error ? error.message : 'Failed to refresh life areas',
        lifeAreasLoading: false
      });
    }
  },

  addCustomLifeArea: async (name: string, iconName: string, color: string) => {
    try {
      set({ lifeAreasLoading: true, lifeAreasError: null });
      const newArea = await LifeAreasService.createCustomLifeArea(name, iconName, color);
      const updatedAreas = [...get().lifeAreas, newArea];
      set({ lifeAreas: updatedAreas, lifeAreasLoading: false });
      return newArea;
    } catch (error) {
      console.error('Error adding custom life area:', error);
      set({
        lifeAreasError: error instanceof Error ? error.message : 'Failed to add custom life area',
        lifeAreasLoading: false
      });
      throw error;
    }
  },

  updateLifeArea: async (id: string, updates: Partial<LifeArea>) => {
    try {
      set({ lifeAreasLoading: true, lifeAreasError: null });
      const updatedArea = await LifeAreasService.updateLifeArea(id, updates);
      const areas = get().lifeAreas.map((area) =>
        area.id === id ? updatedArea : area
      );
      set({ lifeAreas: areas, lifeAreasLoading: false });
    } catch (error) {
      console.error('Error updating life area:', error);
      set({
        lifeAreasError: error instanceof Error ? error.message : 'Failed to update life area',
        lifeAreasLoading: false
      });
      throw error;
    }
  },

  deleteLifeArea: async (id: string) => {
    try {
      const area = get().lifeAreas.find((a) => a.id === id);
      if (!area || !area.isCustom) {
        throw new Error('Cannot delete predefined areas');
      }

      set({ lifeAreasLoading: true, lifeAreasError: null });
      const success = await LifeAreasService.deleteLifeArea(id);

      if (success) {
        const updatedAreas = get().lifeAreas.filter((a) => a.id !== id);
        set({ lifeAreas: updatedAreas, lifeAreasLoading: false });
      } else {
        set({ lifeAreasLoading: false });
      }

      return success;
    } catch (error) {
      console.error('Error deleting life area:', error);
      set({
        lifeAreasError: error instanceof Error ? error.message : 'Failed to delete life area',
        lifeAreasLoading: false
      });
      return false;
    }
  },

  toggleLifeAreaEnabled: async (id: string, enabled: boolean) => {
    try {
      set({ lifeAreasLoading: true, lifeAreasError: null });
      const updatedArea = await LifeAreasService.updateLifeArea(id, { enabled });
      const areas = get().lifeAreas.map((area) =>
        area.id === id ? updatedArea : area
      );
      set({ lifeAreas: areas, lifeAreasLoading: false });
    } catch (error) {
      console.error('Error toggling life area:', error);
      set({
        lifeAreasError: error instanceof Error ? error.message : 'Failed to toggle life area',
        lifeAreasLoading: false
      });
      throw error;
    }
  },

  addXPToLifeArea: async (id: string, xp: number) => {
    try {
      set({ lifeAreasLoading: true, lifeAreasError: null });
      const result = await LifeAreasService.updateAreaXP(id, xp);

      // Refresh the area in local state
      const areas = get().lifeAreas.map((area) =>
        area.id === id
          ? { ...area, totalXP: result.newXP, level: result.newLevel }
          : area
      );
      set({ lifeAreas: areas, lifeAreasLoading: false });

      return {
        newLevel: result.leveledUp ? result.newLevel : undefined,
        leveledUp: result.leveledUp,
      };
    } catch (error) {
      console.error('Error adding XP to life area:', error);
      set({
        lifeAreasError: error instanceof Error ? error.message : 'Failed to add XP to life area',
        lifeAreasLoading: false
      });
      return { leveledUp: false };
    }
  },
});
