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
  refreshLifeAreas: () => void;
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

  refreshLifeAreas: () => {
    const areas = LifeAreasService.getLifeAreas();
    set({ lifeAreas: areas });
  },
});
