import { LifeArea } from '@/types';
import { LifeAreaType } from '@/types/habit';
import { STORAGE_KEYS, LIFE_AREAS } from '@/constants';
import { StorageService } from './storage';
import { getAreaLevelFromXP } from '@/utils/xp';

/**
 * Life Areas data service
 * Supports both predefined (6 default) and custom user-created areas
 */
export class LifeAreasService {
  /**
   * Get all life areas (predefined + custom)
   */
  static getLifeAreas(): LifeArea[] {
    const areas = StorageService.get<LifeArea[]>(STORAGE_KEYS.LIFE_AREAS);
    return areas || this.initializeLifeAreas();
  }

  /**
   * Save all life areas
   */
  static saveLifeAreas(areas: LifeArea[]): boolean {
    return StorageService.set(STORAGE_KEYS.LIFE_AREAS, areas);
  }

  /**
   * Get a specific life area by ID
   */
  static getLifeAreaById(id: string): LifeArea | null {
    const areas = this.getLifeAreas();
    return areas.find((area) => area.id === id) || null;
  }

  /**
   * Get a specific life area by type (for predefined areas)
   */
  static getLifeArea(areaType: LifeAreaType): LifeArea | null {
    const areas = this.getLifeAreas();
    return areas.find((area) => area.area === areaType) || null;
  }

  /**
   * Create a custom life area
   */
  static createCustomLifeArea(
    name: string,
    iconName: string,
    color: string
  ): LifeArea {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      area: name,
      level: 1,
      totalXP: 0,
      isCustom: true,
      enabled: true,
      iconName,
      color,
    };
  }

  /**
   * Add XP to a life area
   * Returns updated area and whether it leveled up
   */
  static addXP(
    area: LifeArea,
    xp: number
  ): { updatedArea: LifeArea; leveledUp: boolean } {
    const oldLevel = area.level;
    const newTotalXP = Math.max(0, area.totalXP + xp);
    const newLevel = getAreaLevelFromXP(newTotalXP);

    const updatedArea: LifeArea = {
      ...area,
      totalXP: newTotalXP,
      level: newLevel,
    };

    return {
      updatedArea,
      leveledUp: newLevel > oldLevel,
    };
  }

  /**
   * Update XP for a specific life area by type (legacy method)
   * Returns the new level if leveled up, otherwise null
   */
  static updateAreaXP(areaType: LifeAreaType, xpDelta: number): number | null {
    const areas = this.getLifeAreas();
    const areaIndex = areas.findIndex((a) => a.area === areaType);

    if (areaIndex === -1) return null;

    const area = areas[areaIndex];
    const result = this.addXP(area, xpDelta);

    areas[areaIndex] = result.updatedArea;
    this.saveLifeAreas(areas);

    return result.leveledUp ? result.updatedArea.level : null;
  }

  /**
   * Initialize life areas with default 6 predefined areas
   */
  static initializeLifeAreas(): LifeArea[] {
    const defaultAreas: LifeArea[] = LIFE_AREAS.map((area, index) => ({
      id: area.toLowerCase(), // Use area name as ID for predefined areas
      area: area as LifeAreaType,
      level: 1,
      totalXP: 0,
      isCustom: false,
      enabled: true, // All predefined areas start enabled
    }));

    this.saveLifeAreas(defaultAreas);
    return defaultAreas;
  }

  /**
   * Reset all life areas to level 1
   */
  static resetAllAreas(): boolean {
    const resetAreas = this.initializeLifeAreas();
    return this.saveLifeAreas(resetAreas);
  }

  /**
   * Get total level across all enabled areas
   */
  static getTotalLevel(): number {
    const areas = this.getLifeAreas();
    return areas
      .filter((area) => area.enabled)
      .reduce((sum, area) => sum + area.level, 0);
  }

  /**
   * Get total XP across all enabled areas
   */
  static getTotalXP(): number {
    const areas = this.getLifeAreas();
    return areas
      .filter((area) => area.enabled)
      .reduce((sum, area) => sum + area.totalXP, 0);
  }

  /**
   * Get only enabled areas
   */
  static getEnabledAreas(): LifeArea[] {
    return this.getLifeAreas().filter((area) => area.enabled);
  }

  /**
   * Get only predefined areas
   */
  static getPredefinedAreas(): LifeArea[] {
    return this.getLifeAreas().filter((area) => !area.isCustom);
  }

  /**
   * Get only custom areas
   */
  static getCustomAreas(): LifeArea[] {
    return this.getLifeAreas().filter((area) => area.isCustom);
  }
}
