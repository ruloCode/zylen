import { ShopItem } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { StorageService } from './storage';

/**
 * Shop Items data service
 * Manages CRUD operations for shop items (indulgences)
 */
export class ShopItemsService {
  /**
   * Get all shop items from localStorage
   */
  static getShopItems(): ShopItem[] {
    const items = StorageService.get<ShopItem[]>(STORAGE_KEYS.SHOP_ITEMS);

    // If no items exist, initialize with defaults
    if (!items || items.length === 0) {
      return this.initializeDefaultItems();
    }

    return items;
  }

  /**
   * Save shop items to localStorage
   */
  static setShopItems(items: ShopItem[]): boolean {
    return StorageService.set(STORAGE_KEYS.SHOP_ITEMS, items);
  }

  /**
   * Initialize with 4 default shop items
   * These items use i18n translation keys for backwards compatibility
   */
  static initializeDefaultItems(): ShopItem[] {
    const defaultItems: ShopItem[] = [
      {
        id: 'default-sweet-treat',
        name: 'shop.items.sweetTreat.name', // i18n key
        iconName: 'Candy',
        cost: 50,
        description: 'shop.items.sweetTreat.description', // i18n key
        category: 'food',
        available: true,
      },
      {
        id: 'default-impulse-buy',
        name: 'shop.items.impulseBuy.name', // i18n key
        iconName: 'ShoppingCart',
        cost: 100,
        description: 'shop.items.impulseBuy.description', // i18n key
        category: 'shopping',
        available: true,
      },
      {
        id: 'default-stay-up-late',
        name: 'shop.items.stayUpLate.name', // i18n key
        iconName: 'Moon',
        cost: 75,
        description: 'shop.items.stayUpLate.description', // i18n key
        category: 'leisure',
        available: true,
      },
      {
        id: 'default-extra-coffee',
        name: 'shop.items.extraCoffee.name', // i18n key
        iconName: 'Coffee',
        cost: 30,
        description: 'shop.items.extraCoffee.description', // i18n key
        category: 'food',
        available: true,
      },
    ];

    this.setShopItems(defaultItems);
    return defaultItems;
  }

  /**
   * Get a single shop item by ID
   */
  static getItemById(id: string): ShopItem | undefined {
    const items = this.getShopItems();
    return items.find((item) => item.id === id);
  }

  /**
   * Add a new shop item
   */
  static addItem(item: ShopItem): boolean {
    const items = this.getShopItems();

    // Ensure item has a unique ID
    if (!item.id) {
      item.id = crypto.randomUUID();
    }

    // Check for duplicate ID
    if (items.some((i) => i.id === item.id)) {
      console.error('Item with this ID already exists');
      return false;
    }

    items.push(item);
    return this.setShopItems(items);
  }

  /**
   * Update an existing shop item
   */
  static updateItem(id: string, updates: Partial<ShopItem>): boolean {
    const items = this.getShopItems();
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      console.error('Item not found');
      return false;
    }

    // Merge updates with existing item
    items[index] = { ...items[index], ...updates };
    return this.setShopItems(items);
  }

  /**
   * Delete a shop item
   * Note: Purchase history is not affected by item deletion
   */
  static deleteItem(id: string): boolean {
    const items = this.getShopItems();
    const filteredItems = items.filter((item) => item.id !== id);

    if (filteredItems.length === items.length) {
      console.error('Item not found');
      return false;
    }

    return this.setShopItems(filteredItems);
  }

  /**
   * Get only available items
   */
  static getAvailableItems(): ShopItem[] {
    return this.getShopItems().filter((item) => item.available !== false);
  }

  /**
   * Get items by category
   */
  static getItemsByCategory(category: string): ShopItem[] {
    return this.getShopItems().filter((item) => item.category === category);
  }

  /**
   * Check if item name is a translation key (starts with 'shop.items.')
   */
  static isTranslationKey(name: string): boolean {
    return name.startsWith('shop.items.');
  }
}
