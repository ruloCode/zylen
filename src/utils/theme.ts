/**
 * Theme utilities — selectable color palettes applied via a `data-theme`
 * attribute on <html>. Theme is a pure UI preference, persisted to
 * localStorage (no Supabase). The actual color values live in `src/index.css`
 * under `[data-theme="x"]` blocks.
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

/** Apply a theme globally by setting the attribute on the document root. */
export function applyTheme(id: ThemeId): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', id);
  }
}

/** Read the persisted theme, falling back to the default if missing/invalid. */
export function getStoredTheme(): ThemeId {
  const stored = StorageService.get<ThemeId>(STORAGE_KEYS.THEME);
  return isThemeId(stored) ? stored : DEFAULT_THEME;
}

/** Persist the chosen theme to localStorage. */
export function persistTheme(id: ThemeId): void {
  StorageService.set(STORAGE_KEYS.THEME, id);
}
