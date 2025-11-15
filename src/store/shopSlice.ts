import { StateCreator } from 'zustand';
import { ShopItem, Purchase, PurchaseHistory } from '@/types';
import { ShopService, ShopItemsService } from '@/services';

export interface ShopSlice {
  purchaseHistory: PurchaseHistory;
  shopItems: ShopItem[];

  // Purchase history actions
  loadPurchaseHistory: () => void;
  purchaseItem: (item: ShopItem) => boolean;
  getTotalSpent: () => number;
  clearHistory: () => void;

  // Shop items actions
  loadShopItems: () => void;
  addShopItem: (item: ShopItem) => boolean;
  updateShopItem: (id: string, updates: Partial<ShopItem>) => boolean;
  deleteShopItem: (id: string) => boolean;
  getShopItemById: (id: string) => ShopItem | undefined;
}

export const createShopSlice: StateCreator<ShopSlice> = (set, get) => ({
  purchaseHistory: { purchases: [], totalSpent: 0 },
  shopItems: [],

  // Purchase history actions
  loadPurchaseHistory: () => {
    const history = ShopService.getPurchaseHistory();
    set({ purchaseHistory: history });
  },

  purchaseItem: (item: ShopItem) => {
    const success = ShopService.addPurchase(item);
    if (success) {
      const history = ShopService.getPurchaseHistory();
      set({ purchaseHistory: history });
    }
    return success;
  },

  getTotalSpent: () => {
    return get().purchaseHistory.totalSpent;
  },

  clearHistory: () => {
    ShopService.clearHistory();
    set({ purchaseHistory: { purchases: [], totalSpent: 0 } });
  },

  // Shop items actions
  loadShopItems: () => {
    const items = ShopItemsService.getShopItems();
    set({ shopItems: items });
  },

  addShopItem: (item: ShopItem) => {
    const success = ShopItemsService.addItem(item);
    if (success) {
      const items = ShopItemsService.getShopItems();
      set({ shopItems: items });
    }
    return success;
  },

  updateShopItem: (id: string, updates: Partial<ShopItem>) => {
    const success = ShopItemsService.updateItem(id, updates);
    if (success) {
      const items = ShopItemsService.getShopItems();
      set({ shopItems: items });
    }
    return success;
  },

  deleteShopItem: (id: string) => {
    const success = ShopItemsService.deleteItem(id);
    if (success) {
      const items = ShopItemsService.getShopItems();
      set({ shopItems: items });
    }
    return success;
  },

  getShopItemById: (id: string) => {
    return get().shopItems.find((item) => item.id === id);
  },
});
