import { StateCreator } from 'zustand';
import { ShopItem, Purchase, PurchaseHistory } from '@/types';
import { ShopService } from '@/services';

export interface ShopSlice {
  purchaseHistory: PurchaseHistory;

  // Actions
  loadPurchaseHistory: () => void;
  purchaseItem: (item: ShopItem) => boolean;
  getTotalSpent: () => number;
  clearHistory: () => void;
}

export const createShopSlice: StateCreator<ShopSlice> = (set, get) => ({
  purchaseHistory: { purchases: [], totalSpent: 0 },

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
});
