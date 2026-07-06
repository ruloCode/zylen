/**
 * Life Areas Service - Supabase Implementation
 *
 * Handles life area operations using Supabase.
 * Supports both predefined (6 default) and custom user-created areas.
 */

import { supabase } from '@/lib/supabase';
import type { LifeArea } from '@/types/lifeArea';
import type { LifeAreaType } from '@/types/habit';
import { LifeAreasServiceError, LIFE_AREA_ERROR_CODES } from '@/types/errors';
import { getAuthUserId } from './utils';
import { mapLifeAreaRowToLifeArea, mapLifeAreaToInsert } from './mappers';
import { getAreaLevelFromXP } from '@/utils/xp';

export class LifeAreasService {
  /**
   * Get all life areas (predefined + custom) for the current user
   * @throws {LifeAreasServiceError} if fetch fails
   */
  static async getLifeAreas(): Promise<LifeArea[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('life_areas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

      if (error) {
        throw new LifeAreasServiceError(
          error.message,
          LIFE_AREA_ERROR_CODES.NOT_FOUND
        );
      }

      return data.map(mapLifeAreaRowToLifeArea);
    } catch (error) {
      if (error instanceof LifeAreasServiceError) throw error;
      console.error('Error in LifeAreasService.getLifeAreas:', error);
      throw new LifeAreasServiceError(
        'Failed to get life areas',
        LIFE_AREA_ERROR_CODES.NOT_FOUND
      );
    }
  }

  /**
   * Get a specific life area by ID
   * @param id Life area ID (UUID)
   */
  static async getLifeAreaById(id: string): Promise<LifeArea | null> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('life_areas')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new LifeAreasServiceError(
          error.message,
          LIFE_AREA_ERROR_CODES.NOT_FOUND
        );
      }

      return mapLifeAreaRowToLifeArea(data);
    } catch (error) {
      if (error instanceof LifeAreasServiceError) throw error;
      console.error('Error in LifeAreasService.getLifeAreaById:', error);
      return null;
    }
  }

  /**
   * Get a specific life area by type (for predefined areas)
   * @param areaType Life area type (e.g., 'Health', 'Finance')
   */
  static async getLifeAreaByType(areaType: LifeAreaType): Promise<LifeArea | null> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('life_areas')
        .select('*')
        .eq('user_id', userId)
        .eq('area_type', areaType.toLowerCase())
        .eq('is_custom', false)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new LifeAreasServiceError(
          error.message,
          LIFE_AREA_ERROR_CODES.NOT_FOUND
        );
      }

      return mapLifeAreaRowToLifeArea(data);
    } catch (error) {
      if (error instanceof LifeAreasServiceError) throw error;
      console.error('Error in LifeAreasService.getLifeAreaByType:', error);
      return null;
    }
  }

  /**
   * Create a custom life area
   * @param name Custom area name
   * @param iconName Lucide icon name
   * @param color Custom color
   */
  static async createCustomLifeArea(
    name: string,
    iconName: string,
    color: string
  ): Promise<LifeArea> {
    try {
      const userId = await getAuthUserId();

      const customArea: Partial<LifeArea> = {
        area: name,
        level: 1,
        totalXP: 0,
        isCustom: true,
        enabled: true,
        iconName,
        color,
      };

      const insertData = mapLifeAreaToInsert(customArea, userId);

      const { data, error } = await supabase
        .from('life_areas')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new LifeAreasServiceError(
          error.message,
          LIFE_AREA_ERROR_CODES.CREATE_FAILED
        );
      }

      return mapLifeAreaRowToLifeArea(data);
    } catch (error) {
      if (error instanceof LifeAreasServiceError) throw error;
      console.error('Error in LifeAreasService.createCustomLifeArea:', error);
      throw new LifeAreasServiceError(
        'Failed to create custom life area',
        LIFE_AREA_ERROR_CODES.CREATE_FAILED
      );
    }
  }

  /**
   * Update a life area
   * @param id Life area ID
   * @param updates Partial life area object
   */
  static async updateLifeArea(
    id: string,
    updates: Partial<LifeArea>
  ): Promise<LifeArea> {
    try {
      const userId = await getAuthUserId();

      const dbUpdates: any = {};
      if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;
      if (updates.level !== undefined) dbUpdates.level = updates.level;
      if (updates.totalXP !== undefined) dbUpdates.total_xp = updates.totalXP;
      if (updates.iconName !== undefined) dbUpdates.icon_name = updates.iconName;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.isCustom && updates.area !== undefined) {
        dbUpdates.custom_name = updates.area;
      }

      const { data, error } = await supabase
        .from('life_areas')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new LifeAreasServiceError(
          error.message,
          LIFE_AREA_ERROR_CODES.UPDATE_FAILED
        );
      }

      return mapLifeAreaRowToLifeArea(data);
    } catch (error) {
      if (error instanceof LifeAreasServiceError) throw error;
      console.error('Error in LifeAreasService.updateLifeArea:', error);
      throw new LifeAreasServiceError(
        'Failed to update life area',
        LIFE_AREA_ERROR_CODES.UPDATE_FAILED
      );
    }
  }

  /**
   * Update XP for a specific life area
   * @param areaId Life area ID (UUID)
   * @param xpDelta Amount to add (positive) or subtract (negative)
   * @returns Object with updated area info and whether it leveled up
   */
  static async updateAreaXP(
    areaId: string,
    xpDelta: number
  ): Promise<{ leveledUp: boolean; newLevel: number; newXP: number }> {
    try {
      const userId = await getAuthUserId();

      // Fetch current area
      const { data: area, error: fetchError } = await supabase
        .from('life_areas')
        .select('*')
        .eq('id', areaId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        throw new LifeAreasServiceError(
          fetchError.message,
          LIFE_AREA_ERROR_CODES.NOT_FOUND
        );
      }

      // Calculate new XP and level
      const oldLevel = area.level;
      const newTotalXP = Math.max(0, area.total_xp + xpDelta);
      const newLevel = getAreaLevelFromXP(newTotalXP);

      // Update in DB
      const { error: updateError } = await supabase
        .from('life_areas')
        .update({
          total_xp: newTotalXP,
          level: newLevel,
        })
        .eq('id', areaId)
        .eq('user_id', userId);

      if (updateError) {
        throw new LifeAreasServiceError(
          updateError.message,
          LIFE_AREA_ERROR_CODES.UPDATE_FAILED
        );
      }

      return {
        leveledUp: newLevel > oldLevel,
        newLevel,
        newXP: newTotalXP,
      };
    } catch (error) {
      if (error instanceof LifeAreasServiceError) throw error;
      console.error('Error in LifeAreasService.updateAreaXP:', error);
      throw new LifeAreasServiceError(
        'Failed to update area XP',
        LIFE_AREA_ERROR_CODES.UPDATE_FAILED
      );
    }
  }

  /**
   * Delete a life area (custom areas only)
   * @param id Life area ID
   */
  static async deleteLifeArea(id: string): Promise<boolean> {
    try {
      const userId = await getAuthUserId();

      // Only allow deleting custom areas
      const { data: area } = await supabase
        .from('life_areas')
        .select('is_custom')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (!area?.is_custom) {
        throw new LifeAreasServiceError(
          'Cannot delete predefined life areas',
          LIFE_AREA_ERROR_CODES.DELETE_FAILED
        );
      }

      const { error } = await supabase
        .from('life_areas')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw new LifeAreasServiceError(
          error.message,
          LIFE_AREA_ERROR_CODES.DELETE_FAILED
        );
      }

      return true;
    } catch (error) {
      if (error instanceof LifeAreasServiceError) throw error;
      console.error('Error in LifeAreasService.deleteLifeArea:', error);
      throw new LifeAreasServiceError(
        'Failed to delete life area',
        LIFE_AREA_ERROR_CODES.DELETE_FAILED
      );
    }
  }

  /**
   * Get total level across all enabled areas
   */
  static async getTotalLevel(): Promise<number> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('life_areas')
        .select('level')
        .eq('user_id', userId)
        .eq('enabled', true);

      if (error) {
        console.error('Error fetching total level:', error);
        return 0;
      }

      return data.reduce((sum, area) => sum + area.level, 0);
    } catch (error) {
      console.error('Error in LifeAreasService.getTotalLevel:', error);
      return 0;
    }
  }

  /**
   * Get total XP across all enabled areas
   */
  static async getTotalXP(): Promise<number> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('life_areas')
        .select('total_xp')
        .eq('user_id', userId)
        .eq('enabled', true);

      if (error) {
        console.error('Error fetching total XP:', error);
        return 0;
      }

      return data.reduce((sum, area) => sum + area.total_xp, 0);
    } catch (error) {
      console.error('Error in LifeAreasService.getTotalXP:', error);
      return 0;
    }
  }

  /**
   * Get only enabled areas
   */
  static async getEnabledAreas(): Promise<LifeArea[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('life_areas')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true)
        .order('created_at');

      if (error) {
        throw new LifeAreasServiceError(error.message);
      }

      return data.map(mapLifeAreaRowToLifeArea);
    } catch (error) {
      console.error('Error in LifeAreasService.getEnabledAreas:', error);
      return [];
    }
  }

  /**
   * Get only predefined areas
   */
  static async getPredefinedAreas(): Promise<LifeArea[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('life_areas')
        .select('*')
        .eq('user_id', userId)
        .eq('is_custom', false)
        .order('created_at');

      if (error) {
        throw new LifeAreasServiceError(error.message);
      }

      return data.map(mapLifeAreaRowToLifeArea);
    } catch (error) {
      console.error('Error in LifeAreasService.getPredefinedAreas:', error);
      return [];
    }
  }

  /**
   * Get only custom areas
   */
  static async getCustomAreas(): Promise<LifeArea[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('life_areas')
        .select('*')
        .eq('user_id', userId)
        .eq('is_custom', true)
        .order('created_at');

      if (error) {
        throw new LifeAreasServiceError(error.message);
      }

      return data.map(mapLifeAreaRowToLifeArea);
    } catch (error) {
      console.error('Error in LifeAreasService.getCustomAreas:', error);
      return [];
    }
  }

  /**
   * Initialize life areas - NOT NEEDED with Supabase
   * Life areas are auto-created by database trigger on user signup
   * This method is kept for backward compatibility but does nothing
   */
  static async initializeLifeAreas(): Promise<LifeArea[]> {
    console.warn(
      'LifeAreasService.initializeLifeAreas is deprecated. Life areas are auto-created by Supabase trigger.'
    );
    return this.getLifeAreas();
  }

  /**
   * Reset all life areas to level 1
   */
  static async resetAllAreas(): Promise<boolean> {
    try {
      const userId = await getAuthUserId();

      const { error } = await supabase
        .from('life_areas')
        .update({
          level: 1,
          total_xp: 0,
        })
        .eq('user_id', userId);

      if (error) {
        throw new LifeAreasServiceError(
          error.message,
          LIFE_AREA_ERROR_CODES.UPDATE_FAILED
        );
      }

      return true;
    } catch (error) {
      console.error('Error in LifeAreasService.resetAllAreas:', error);
      return false;
    }
  }
}
