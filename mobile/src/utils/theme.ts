/**
 * Theme utilities — selectable color palettes. Theme is a pure UI preference,
 * persisted to device storage (no Supabase).
 *
 * On native there is no DOM to stamp a `data-theme` attribute on: the actual
 * variable values live in src/theme/themeVars.ts and are applied by
 * ThemeProvider (nativewind `vars()`) reacting to the store's theme state, so
 * `applyTheme` is a no-op kept for API compatibility with ported code.
 */

import { StorageService } from '@/services/storage';
import { STORAGE_KEYS } from '@/constants/config';

/** All selectable theme ids (order is irrelevant here; UI order lives in constants/themes.ts). */
export const THEME_IDS = [
  'nous',
  'midnight',
  'ember',
  'mono',
  'cyberpunk',
  'slate',
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = 'midnight';

/** Type guard — validates an unknown value is a known theme id. */
export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);
}

/** No-op on native: ThemeProvider re-renders from store state instead. */
export function applyTheme(_id: ThemeId): void {
  // Intentionally empty — see src/theme/ThemeProvider.tsx.
}

/** Read the persisted theme, falling back to the default if missing/invalid. */
export function getStoredTheme(): ThemeId {
  const stored = StorageService.get<ThemeId>(STORAGE_KEYS.THEME);
  return isThemeId(stored) ? stored : DEFAULT_THEME;
}

/** Persist the chosen theme to device storage. */
export function persistTheme(id: ThemeId): void {
  StorageService.set(STORAGE_KEYS.THEME, id);
}
