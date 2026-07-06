/**
 * Shop Items Service - Supabase Implementation
 *
 * Manages CRUD operations for shop items (indulgences).
 * Items are auto-created on user signup via database trigger.
 */

import { supabase } from '@/lib/supabase';
import type { ShopItem } from '@/types/shop';
import { ShopItemsServiceError, SHOP_ITEMS_ERROR_CODES } from '@/types/errors';
import { getAuthUserId } from './utils';
import { mapShopItemRowToShopItem, mapShopItemToInsert } from './mappers';

export class ShopItemsService {
  /**
   * Get all shop items for the current user
   * @throws {ShopItemsServiceError} if fetch fails
   */
  static async getShopItems(): Promise<ShopItem[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

      if (error) {
        throw new ShopItemsServiceError(
          error.message,
          SHOP_ITEMS_ERROR_CODES.NOT_FOUND
        );
      }

      return data.map(mapShopItemRowToShopItem);
    } catch (error) {
      if (error instanceof ShopItemsServiceError) throw error;
      console.error('Error in ShopItemsService.getShopItems:', error);
      throw new ShopItemsServiceError(
        'Failed to get shop items',
        SHOP_ITEMS_ERROR_CODES.NOT_FOUND
      );
    }
  }

  /**
   * Get a single shop item by ID
   * @param id Shop item ID
   */
  static async getItemById(id: string): Promise<ShopItem | null> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new ShopItemsServiceError(
          error.message,
          SHOP_ITEMS_ERROR_CODES.NOT_FOUND
        );
      }

      return mapShopItemRowToShopItem(data);
    } catch (error) {
      if (error instanceof ShopItemsServiceError) throw error;
      console.error('Error in ShopItemsService.getItemById:', error);
      return null;
    }
  }

  /**
   * Add a new shop item
   * @param item Shop item data
   */
  static async addItem(item: Partial<ShopItem>): Promise<ShopItem> {
    try {
      const userId = await getAuthUserId();

      const insertData = mapShopItemToInsert(item, userId, false);

      const { data, error } = await supabase
        .from('shop_items')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new ShopItemsServiceError(
          error.message,
          SHOP_ITEMS_ERROR_CODES.CREATE_FAILED
        );
      }

      return mapShopItemRowToShopItem(data);
    } catch (error) {
      if (error instanceof ShopItemsServiceError) throw error;
      console.error('Error in ShopItemsService.addItem:', error);
      throw new ShopItemsServiceError(
        'Failed to add shop item',
        SHOP_ITEMS_ERROR_CODES.CREATE_FAILED
      );
    }
  }

  /**
   * Update an existing shop item
   * @param id Shop item ID
   * @param updates Partial shop item data
   */
  static async updateItem(
    id: string,
    updates: Partial<ShopItem>
  ): Promise<ShopItem> {
    try {
      const userId = await getAuthUserId();

      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.iconName !== undefined) dbUpdates.icon_name = updates.iconName;
      if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.available !== undefined) dbUpdates.available = updates.available;

      const { data, error } = await supabase
        .from('shop_items')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new ShopItemsServiceError(
          error.message,
          SHOP_ITEMS_ERROR_CODES.UPDATE_FAILED
        );
      }

      return mapShopItemRowToShopItem(data);
    } catch (error) {
      if (error instanceof ShopItemsServiceError) throw error;
      console.error('Error in ShopItemsService.updateItem:', error);
      throw new ShopItemsServiceError(
        'Failed to update shop item',
        SHOP_ITEMS_ERROR_CODES.UPDATE_FAILED
      );
    }
  }

  /**
   * Delete a shop item
   * Note: Purchase history is not affected by item deletion
   * @param id Shop item ID
   */
  static async deleteItem(id: string): Promise<boolean> {
    try {
      const userId = await getAuthUserId();

      const { error } = await supabase
        .from('shop_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw new ShopItemsServiceError(
          error.message,
          SHOP_ITEMS_ERROR_CODES.DELETE_FAILED
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ShopItemsServiceError) throw error;
      console.error('Error in ShopItemsService.deleteItem:', error);
      throw new ShopItemsServiceError(
        'Failed to delete shop item',
        SHOP_ITEMS_ERROR_CODES.DELETE_FAILED
      );
    }
  }

  /**
   * Get only available items
   */
  static async getAvailableItems(): Promise<ShopItem[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('user_id', userId)
        .eq('available', true)
        .order('created_at');

      if (error) {
        throw new ShopItemsServiceError(error.message);
      }

      return data.map(mapShopItemRowToShopItem);
    } catch (error) {
      console.error('Error in ShopItemsService.getAvailableItems:', error);
      return [];
    }
  }

  /**
   * Get items by category
   * @param category Category name
   */
  static async getItemsByCategory(category: string): Promise<ShopItem[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('created_at');

      if (error) {
        throw new ShopItemsServiceError(error.message);
      }

      return data.map(mapShopItemRowToShopItem);
    } catch (error) {
      console.error('Error in ShopItemsService.getItemsByCategory:', error);
      return [];
    }
  }

  /**
   * Check if item name is a translation key (starts with 'shop.items.')
   */
  static isTranslationKey(name: string): boolean {
    return name.startsWith('shop.items.');
  }

  /**
   * Initialize default items - NOT NEEDED with Supabase
   * Shop items are auto-created by database trigger on user signup
   * This method is kept for backward compatibility but does nothing
   */
  static async initializeDefaultItems(): Promise<ShopItem[]> {
    console.warn(
      'ShopItemsService.initializeDefaultItems is deprecated. Shop items are auto-created by Supabase trigger.'
    );
    return this.getShopItems();
  }
}
