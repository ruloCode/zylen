import { LifeArea } from '@/types';
import { LifeAreaType } from '@/types/habit';
import { STORAGE_KEYS, LIFE_AREAS } from '@/constants';
import { StorageService } from './storage';
import { getAreaLevelFromXP } from '@/utils/xp';

/**
 * Life Areas data service
 */
export class LifeAreasService {
  /**
   * Get all life areas
   */
  static getLifeAreas(): LifeArea[] {
    const areas = StorageService.get<LifeArea[]>(STORAGE_KEYS.LIFE_AREAS);
    return areas || this.initializeLifeAreas();
  }

  /**
   * Save all life areas
   */
  static setLifeAreas(areas: LifeArea[]): boolean {
    return StorageService.set(STORAGE_KEYS.LIFE_AREAS, areas);
  }

  /**
   * Get a specific life area by type
   */
  static getLifeArea(areaType: LifeAreaType): LifeArea | null {
    const areas = this.getLifeAreas();
    return areas.find((area) => area.area === areaType) || null;
  }

  /**
   * Update XP for a specific life area
   * Returns the new level if leveled up, otherwise null
   */
  static updateAreaXP(areaType: LifeAreaType, xpDelta: number): number | null {
    const areas = this.getLifeAreas();
    const areaIndex = areas.findIndex((a) => a.area === areaType);

    if (areaIndex === -1) return null;

    const area = areas[areaIndex];
    const oldLevel = area.level;

    // Update XP
    area.totalXP += xpDelta;

    // Ensure XP doesn't go negative
    if (area.totalXP < 0) area.totalXP = 0;

    // Calculate new level
    const newLevel = getAreaLevelFromXP(area.totalXP);
    area.level = newLevel;

    // Save changes
    this.setLifeAreas(areas);

    // Return new level if leveled up
    return newLevel > oldLevel ? newLevel : null;
  }

  /**
   * Initialize life areas with default values
   */
  static initializeLifeAreas(): LifeArea[] {
    const defaultAreas: LifeArea[] = LIFE_AREAS.map((area) => ({
      area: area as LifeAreaType,
      level: 1,
      totalXP: 0,
    }));

    this.setLifeAreas(defaultAreas);
    return defaultAreas;
  }

  /**
   * Reset all life areas to level 1
   */
  static resetAllAreas(): boolean {
    const resetAreas = this.initializeLifeAreas();
    return this.setLifeAreas(resetAreas);
  }

  /**
   * Get total level across all areas
   */
  static getTotalLevel(): number {
    const areas = this.getLifeAreas();
    return areas.reduce((sum, area) => sum + area.level, 0);
  }

  /**
   * Get total XP across all areas
   */
  static getTotalXP(): number {
    const areas = this.getLifeAreas();
    return areas.reduce((sum, area) => sum + area.totalXP, 0);
  }
}
