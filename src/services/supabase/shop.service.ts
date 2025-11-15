/**
 * Shop Service - Supabase Implementation
 *
 * Handles purchase operations using Supabase.
 */

import { supabase } from '@/lib/supabase';
import type { Purchase, PurchaseHistory } from '@/types/shop';
import { ShopServiceError, SHOP_ERROR_CODES } from '@/types/errors';
import { getAuthUserId, getTodayDateRange } from './utils';
import { mapPurchaseRowToPurchase } from './mappers';
import { UserService } from './user.service';

export class ShopService {
  /**
   * Get purchase history for the current user
   * @returns Purchase history with all purchases and calculated total spent
   */
  static async getPurchaseHistory(): Promise<PurchaseHistory> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false });

      if (error) {
        throw new ShopServiceError(error.message);
      }

      const purchases = data.map(mapPurchaseRowToPurchase);
      const totalSpent = purchases.reduce((sum, p) => sum + p.cost, 0);

      return {
        purchases,
        totalSpent,
      };
    } catch (error) {
      if (error instanceof ShopServiceError) throw error;
      console.error('Error in ShopService.getPurchaseHistory:', error);
      throw new ShopServiceError(
        'Failed to get purchase history',
        SHOP_ERROR_CODES.PURCHASE_FAILED
      );
    }
  }

  /**
   * Add a purchase
   * This will:
   * 1. Check if user has enough points
   * 2. Create purchase record
   * 3. Deduct points from user
   * @param itemId Shop item ID
   * @throws {ShopServiceError} if purchase fails or insufficient points
   */
  static async addPurchase(itemId: string): Promise<Purchase> {
    try {
      const userId = await getAuthUserId();

      // Get item details
      const { data: item, error: itemError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', userId)
        .single();

      if (itemError || !item) {
        throw new ShopServiceError('Shop item not found', SHOP_ERROR_CODES.ITEM_NOT_FOUND);
      }

      // Check if item is available
      if (!item.available) {
        throw new ShopServiceError('Item is not available', SHOP_ERROR_CODES.ITEM_UNAVAILABLE);
      }

      // Get user's current points
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        throw new ShopServiceError('User profile not found');
      }

      // Check if user has enough points
      if (profile.points < item.cost) {
        throw new ShopServiceError(
          'Insufficient points',
          SHOP_ERROR_CODES.INSUFFICIENT_POINTS
        );
      }

      // Create purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          shop_item_id: itemId,
          item_name: item.name,
          cost: item.cost,
        })
        .select()
        .single();

      if (purchaseError) {
        throw new ShopServiceError(
          purchaseError.message,
          SHOP_ERROR_CODES.PURCHASE_FAILED
        );
      }

      // Deduct points from user
      await UserService.updatePoints(-item.cost);

      return mapPurchaseRowToPurchase(purchase);
    } catch (error) {
      if (error instanceof ShopServiceError) throw error;
      console.error('Error in ShopService.addPurchase:', error);
      throw new ShopServiceError(
        'Failed to complete purchase',
        SHOP_ERROR_CODES.PURCHASE_FAILED
      );
    }
  }

  /**
   * Get total amount spent (all time)
   */
  static async getTotalSpent(): Promise<number> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('purchases')
        .select('cost')
        .eq('user_id', userId);

      if (error) {
        throw new ShopServiceError(error.message);
      }

      return data.reduce((sum, p) => sum + p.cost, 0);
    } catch (error) {
      console.error('Error in ShopService.getTotalSpent:', error);
      return 0;
    }
  }

  /**
   * Get purchases for a specific item
   * @param itemId Shop item ID
   */
  static async getPurchasesByItem(itemId: string): Promise<Purchase[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('shop_item_id', itemId)
        .order('purchased_at', { ascending: false });

      if (error) {
        throw new ShopServiceError(error.message);
      }

      return data.map(mapPurchaseRowToPurchase);
    } catch (error) {
      console.error('Error in ShopService.getPurchasesByItem:', error);
      return [];
    }
  }

  /**
   * Get purchases within a date range
   * @param start Start date
   * @param end End date
   */
  static async getPurchasesByDateRange(start: Date, end: Date): Promise<Purchase[]> {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .gte('purchased_at', start.toISOString())
        .lte('purchased_at', end.toISOString())
        .order('purchased_at', { ascending: false });

      if (error) {
        throw new ShopServiceError(error.message);
      }

      return data.map(mapPurchaseRowToPurchase);
    } catch (error) {
      console.error('Error in ShopService.getPurchasesByDateRange:', error);
      return [];
    }
  }

  /**
   * Get today's purchases
   */
  static async getTodaysPurchases(): Promise<Purchase[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    return this.getPurchasesByDateRange(startOfDay, endOfDay);
  }

  /**
   * Clear purchase history (delete all purchases)
   * WARNING: This cannot be undone!
   */
  static async clearHistory(): Promise<boolean> {
    try {
      const userId = await getAuthUserId();

      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new ShopServiceError(error.message);
      }

      return true;
    } catch (error) {
      console.error('Error in ShopService.clearHistory:', error);
      return false;
    }
  }

  /**
   * Set purchase history - DEPRECATED
   * This method is from the localStorage version and is no longer needed
   */
  static async setPurchaseHistory(history: PurchaseHistory): Promise<boolean> {
    console.warn(
      'ShopService.setPurchaseHistory is deprecated. Purchases are managed individually in Supabase.'
    );
    return false;
  }
}
