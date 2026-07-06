/**
 * Theme metadata for the ThemeSelector UI.
 *
 * `swatch` values are LITERAL HSL colors (not CSS vars) so each preview card
 * always shows its own palette regardless of the currently active theme.
 * They mirror the `[data-theme="x"]` blocks in src/index.css.
 */

import { ThemeId } from '@/utils/theme';

export interface ThemeSwatch {
  bg: string;
  surface: string;
  text: string;
  accent: string;
}

export interface ThemeMeta {
  id: ThemeId;
  /** i18n key for the display name (themes.list.<id>.name) */
  nameKey: string;
  /** i18n key for the short description (themes.list.<id>.desc) */
  descKey: string;
  swatch: ThemeSwatch;
}

/** Display order in the selector (matches the reference screenshot grid). */
export const THEMES: ThemeMeta[] = [
  {
    id: 'nous',
    nameKey: 'themes.list.nous.name',
    descKey: 'themes.list.nous.desc',
    swatch: {
      bg: 'hsl(210 30% 96%)',
      surface: 'hsl(0 0% 100%)',
      text: 'hsl(217 33% 17%)',
      accent: 'hsl(211 92% 52%)',
    },
  },
  {
    id: 'midnight',
    nameKey: 'themes.list.midnight.name',
    descKey: 'themes.list.midnight.desc',
    swatch: {
      bg: 'hsl(240 30% 8%)',
      surface: 'hsl(244 26% 13%)',
      text: 'hsl(250 30% 96%)',
      accent: 'hsl(258 90% 70%)',
    },
  },
  {
    id: 'ember',
    nameKey: 'themes.list.ember.name',
    descKey: 'themes.list.ember.desc',
    swatch: {
      bg: 'hsl(20 30% 6%)',
      surface: 'hsl(18 26% 10%)',
      text: 'hsl(36 40% 95%)',
      accent: 'hsl(32 95% 56%)',
    },
  },
  {
    id: 'mono',
    nameKey: 'themes.list.mono.name',
    descKey: 'themes.list.mono.desc',
    swatch: {
      bg: 'hsl(0 0% 4%)',
      surface: 'hsl(0 0% 9%)',
      text: 'hsl(0 0% 98%)',
      accent: 'hsl(0 0% 96%)',
    },
  },
  {
    id: 'cyberpunk',
    nameKey: 'themes.list.cyberpunk.name',
    descKey: 'themes.list.cyberpunk.desc',
    swatch: {
      bg: 'hsl(0 0% 3%)',
      surface: 'hsl(150 20% 7%)',
      text: 'hsl(120 30% 96%)',
      accent: 'hsl(140 100% 50%)',
    },
  },
  {
    id: 'slate',
    nameKey: 'themes.list.slate.name',
    descKey: 'themes.list.slate.desc',
    swatch: {
      bg: 'hsl(215 28% 12%)',
      surface: 'hsl(215 24% 17%)',
      text: 'hsl(210 30% 95%)',
      accent: 'hsl(207 60% 60%)',
    },
  },
];
