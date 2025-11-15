import { StateCreator } from 'zustand';
import { LifeArea } from '@/types';
import { LifeAreaType } from '@/types/habit';
import { LifeAreasService } from '@/services';

export interface LifeAreasSlice {
  lifeAreas: LifeArea[];
  lifeAreasInitialized: boolean;

  // Actions
  initializeLifeAreas: () => void;
  loadLifeAreas: () => void;
  getLifeArea: (area: LifeAreaType) => LifeArea | undefined;
  getLifeAreaById: (id: string) => LifeArea | undefined;
  refreshLifeAreas: () => void;
  addCustomLifeArea: (name: string, iconName: string, color: string) => LifeArea;
  updateLifeArea: (id: string, updates: Partial<LifeArea>) => void;
  deleteLifeArea: (id: string) => boolean;
  toggleLifeAreaEnabled: (id: string, enabled: boolean) => void;
  addXPToLifeArea: (id: string, xp: number) => { newLevel?: number; leveledUp: boolean };
}

export const createLifeAreasSlice: StateCreator<LifeAreasSlice> = (set, get) => ({
  lifeAreas: [],
  lifeAreasInitialized: false,

  initializeLifeAreas: () => {
    const areas = LifeAreasService.getLifeAreas();
    set({ lifeAreas: areas, lifeAreasInitialized: true });
  },

  loadLifeAreas: () => {
    const areas = LifeAreasService.getLifeAreas();
    set({ lifeAreas: areas });
  },

  getLifeArea: (area: LifeAreaType) => {
    return get().lifeAreas.find((a) => a.area === area);
  },

  getLifeAreaById: (id: string) => {
    return get().lifeAreas.find((a) => a.id === id);
  },

  refreshLifeAreas: () => {
    const areas = LifeAreasService.getLifeAreas();
    set({ lifeAreas: areas });
  },

  addCustomLifeArea: (name: string, iconName: string, color: string) => {
    const newArea = LifeAreasService.createCustomLifeArea(name, iconName, color);
    const updatedAreas = [...get().lifeAreas, newArea];
    LifeAreasService.saveLifeAreas(updatedAreas);
    set({ lifeAreas: updatedAreas });
    return newArea;
  },

  updateLifeArea: (id: string, updates: Partial<LifeArea>) => {
    const areas = get().lifeAreas.map((area) =>
      area.id === id ? { ...area, ...updates } : area
    );
    LifeAreasService.saveLifeAreas(areas);
    set({ lifeAreas: areas });
  },

  deleteLifeArea: (id: string) => {
    const area = get().lifeAreas.find((a) => a.id === id);
    if (!area || !area.isCustom) return false; // Can't delete predefined areas

    const updatedAreas = get().lifeAreas.filter((a) => a.id !== id);
    LifeAreasService.saveLifeAreas(updatedAreas);
    set({ lifeAreas: updatedAreas });
    return true;
  },

  toggleLifeAreaEnabled: (id: string, enabled: boolean) => {
    const areas = get().lifeAreas.map((area) =>
      area.id === id ? { ...area, enabled } : area
    );
    LifeAreasService.saveLifeAreas(areas);
    set({ lifeAreas: areas });
  },

  addXPToLifeArea: (id: string, xp: number) => {
    const areas = get().lifeAreas;
    const areaIndex = areas.findIndex((a) => a.id === id);

    if (areaIndex === -1) {
      return { leveledUp: false };
    }

    const area = areas[areaIndex];
    const result = LifeAreasService.addXP(area, xp);

    const updatedAreas = [...areas];
    updatedAreas[areaIndex] = result.updatedArea;

    LifeAreasService.saveLifeAreas(updatedAreas);
    set({ lifeAreas: updatedAreas });

    return {
      newLevel: result.leveledUp ? result.updatedArea.level : undefined,
      leveledUp: result.leveledUp,
    };
  },
});
