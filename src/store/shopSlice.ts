import { StateCreator } from 'zustand';
import { ShopItem, Purchase, PurchaseHistory } from '@/types';
import { ShopService } from '@/services/supabase/shop.service';
import { ShopItemsService } from '@/services/supabase/shopItems.service';

export interface ShopSlice {
  purchaseHistory: PurchaseHistory;
  shopItems: ShopItem[];
  isLoading: boolean;
  error: string | null;

  // Purchase history actions
  loadPurchaseHistory: () => Promise<void>;
  purchaseItem: (itemId: string) => Promise<boolean>;
  getTotalSpent: () => number;
  clearHistory: () => Promise<void>;

  // Shop items actions
  loadShopItems: () => Promise<void>;
  addShopItem: (item: Partial<ShopItem>) => Promise<boolean>;
  updateShopItem: (id: string, updates: Partial<ShopItem>) => Promise<boolean>;
  deleteShopItem: (id: string) => Promise<boolean>;
  getShopItemById: (id: string) => ShopItem | undefined;
}

export const createShopSlice: StateCreator<ShopSlice> = (set, get) => ({
  purchaseHistory: { purchases: [], totalSpent: 0 },
  shopItems: [],
  isLoading: false,
  error: null,

  // Purchase history actions
  loadPurchaseHistory: async () => {
    try {
      set({ isLoading: true, error: null });

      const history = await ShopService.getPurchaseHistory();

      set({ purchaseHistory: history, isLoading: false });
    } catch (error) {
      console.error('Error loading purchase history:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load purchase history',
        isLoading: false,
      });
    }
  },

  purchaseItem: async (itemId: string) => {
    try {
      set({ isLoading: true, error: null });

      // This will check points, create purchase, and deduct points
      const purchase = await ShopService.addPurchase(itemId);

      // Reload purchase history
      const history = await ShopService.getPurchaseHistory();

      set({ purchaseHistory: history, isLoading: false });

      return true;
    } catch (error) {
      console.error('Error purchasing item:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to purchase item',
        isLoading: false,
      });
      return false;
    }
  },

  getTotalSpent: () => {
    return get().purchaseHistory.totalSpent;
  },

  clearHistory: async () => {
    try {
      set({ isLoading: true, error: null });

      await ShopService.clearHistory();

      set({
        purchaseHistory: { purchases: [], totalSpent: 0 },
        isLoading: false,
      });
    } catch (error) {
      console.error('Error clearing history:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to clear history',
        isLoading: false,
      });
    }
  },

  // Shop items actions
  loadShopItems: async () => {
    try {
      set({ isLoading: true, error: null });

      const items = await ShopItemsService.getShopItems();

      set({ shopItems: items, isLoading: false });
    } catch (error) {
      console.error('Error loading shop items:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load shop items',
        isLoading: false,
      });
    }
  },

  addShopItem: async (item: Partial<ShopItem>) => {
    try {
      set({ isLoading: true, error: null });

      await ShopItemsService.addItem(item);

      // Reload items
      const items = await ShopItemsService.getShopItems();

      set({ shopItems: items, isLoading: false });

      return true;
    } catch (error) {
      console.error('Error adding shop item:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to add shop item',
        isLoading: false,
      });
      return false;
    }
  },

  updateShopItem: async (id: string, updates: Partial<ShopItem>) => {
    try {
      set({ isLoading: true, error: null });

      await ShopItemsService.updateItem(id, updates);

      // Reload items
      const items = await ShopItemsService.getShopItems();

      set({ shopItems: items, isLoading: false });

      return true;
    } catch (error) {
      console.error('Error updating shop item:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update shop item',
        isLoading: false,
      });
      return false;
    }
  },

  deleteShopItem: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      await ShopItemsService.deleteItem(id);

      // Remove from state
      set((state) => ({
        shopItems: state.shopItems.filter((item) => item.id !== id),
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error deleting shop item:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete shop item',
        isLoading: false,
      });
      return false;
    }
  },

  getShopItemById: (id: string) => {
    return get().shopItems.find((item) => item.id === id);
  },
});
