/**
 * Synchronous key-value storage facade over AsyncStorage.
 *
 * The web app reads/writes localStorage synchronously all over the codebase.
 * To keep that ported code unchanged, this module holds an in-memory mirror
 * of AsyncStorage that is hydrated ONCE at app boot (before the store
 * initializes — see app/_layout.tsx). After hydration, reads are sync from
 * the mirror and writes go through to AsyncStorage in the background.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const cache = new Map<string, string>();
let hydrated = false;

export const kv = {
  /** Load every persisted key into the in-memory mirror. Call once at boot. */
  async hydrate(): Promise<void> {
    if (hydrated) return;
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pairs = await AsyncStorage.multiGet(keys);
      for (const [key, value] of pairs) {
        if (value != null) cache.set(key, value);
      }
    } catch (error) {
      console.error('kvStorage hydration failed:', error);
    }
    hydrated = true;
  },

  isHydrated(): boolean {
    return hydrated;
  },

  getItem(key: string): string | null {
    return cache.get(key) ?? null;
  },

  setItem(key: string, value: string): void {
    cache.set(key, value);
    AsyncStorage.setItem(key, value).catch((error) =>
      console.error(`kvStorage write failed for "${key}":`, error)
    );
  },

  removeItem(key: string): void {
    cache.delete(key);
    AsyncStorage.removeItem(key).catch((error) =>
      console.error(`kvStorage remove failed for "${key}":`, error)
    );
  },

  clear(): void {
    cache.clear();
    AsyncStorage.clear().catch((error) =>
      console.error('kvStorage clear failed:', error)
    );
  },

  getAllKeys(): string[] {
    return Array.from(cache.keys());
  },
};
