import { ReactNode } from 'react';

export interface ShopItem {
  id: string;
  name: string;
  iconName: string; // Changed from icon: ReactNode
  cost: number;
  description: string;
  category?: 'food' | 'leisure' | 'shopping' | 'other';
  available?: boolean;
}

export interface Purchase {
  id: string;
  itemId: string;
  itemName: string;
  cost: number;
  purchasedAt: Date;
}

export interface PurchaseHistory {
  purchases: Purchase[];
  totalSpent: number;
}
