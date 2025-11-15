import { ShopItem, Purchase, PurchaseHistory } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { StorageService } from './storage';

/**
 * Shop data service
 */
export class ShopService {
  static getPurchaseHistory(): PurchaseHistory {
    return (
      StorageService.get<PurchaseHistory>(STORAGE_KEYS.PURCHASES) || {
        purchases: [],
        totalSpent: 0,
      }
    );
  }

  static setPurchaseHistory(history: PurchaseHistory): boolean {
    return StorageService.set(STORAGE_KEYS.PURCHASES, history);
  }

  static addPurchase(item: ShopItem): boolean {
    const history = this.getPurchaseHistory();

    const purchase: Purchase = {
      id: crypto.randomUUID(),
      itemId: item.id,
      itemName: item.name,
      cost: item.cost,
      purchasedAt: new Date(),
    };

    history.purchases.push(purchase);
    history.totalSpent += item.cost;

    return this.setPurchaseHistory(history);
  }

  static getTotalSpent(): number {
    return this.getPurchaseHistory().totalSpent;
  }

  static getPurchasesByItem(itemId: string): Purchase[] {
    return this.getPurchaseHistory().purchases.filter(
      (p) => p.itemId === itemId
    );
  }

  static getPurchasesByDateRange(start: Date, end: Date): Purchase[] {
    return this.getPurchaseHistory().purchases.filter((p) => {
      const purchaseDate = new Date(p.purchasedAt);
      return purchaseDate >= start && purchaseDate <= end;
    });
  }

  static clearHistory(): boolean {
    return this.setPurchaseHistory({ purchases: [], totalSpent: 0 });
  }
}
