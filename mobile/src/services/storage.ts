/**
 * Generic storage service with type safety.
 *
 * Same API as the web StorageService (localStorage-backed), implemented over
 * the synchronous AsyncStorage mirror in @/lib/kvStorage.
 */

import { kv } from '@/lib/kvStorage';

export class StorageService {
  /**
   * Get item from storage with type safety
   */
  static get<T>(key: string): T | null {
    try {
      const item = kv.getItem(key);
      if (!item) return null;

      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from storage key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set item in storage
   */
  static set<T>(key: string, value: T): boolean {
    try {
      kv.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to storage key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove item from storage
   */
  static remove(key: string): boolean {
    try {
      kv.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing storage key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all storage items
   */
  static clear(): boolean {
    try {
      kv.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  static has(key: string): boolean {
    return kv.getItem(key) !== null;
  }

  /**
   * Get all keys matching a prefix
   */
  static getKeysByPrefix(prefix: string): string[] {
    return kv.getAllKeys().filter((key) => key.startsWith(prefix));
  }

  /**
   * Get storage size in bytes (approximate)
   */
  static getSize(): number {
    let size = 0;
    for (const key of kv.getAllKeys()) {
      const value = kv.getItem(key);
      size += key.length + (value?.length || 0);
    }
    return size;
  }
}
