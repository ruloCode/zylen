/**
 * Life-area ("realm") visual catalog — single source of truth for the accent
 * color, lucide icon, gem illustration and i18n key of each predefined life
 * area. These mappings were previously duplicated across Streaks, Profile,
 * LifeAreaCard/LifeAreaModal and AdvancedStats.
 */

import type { LifeArea } from '@/types';

export interface LifeAreaMeta {
  /** Slug shared by the gem illustration filename and the i18n key ('health'…). */
  key: string;
  /** Full i18n key for the localized display name. */
  i18nKey: string;
  /** Lucide icon name, resolved at render time via getIcon() (fallback icon). */
  iconName: string;
  /** Accent color (hex). */
  color: string;
  /** Gem illustration path under public/. */
  image: string;
}

function buildMeta(key: string, iconName: string, color: string): LifeAreaMeta {
  return {
    key,
    i18nKey: `lifeAreas.${key}`,
    iconName,
    color,
    image: `/life-areas/${key}.png`,
  };
}

/** The six predefined realms, in canonical display order. */
export const LIFE_AREA_CATALOG: LifeAreaMeta[] = [
  buildMeta('health', 'Heart', '#4CAF6D'),
  buildMeta('finance', 'DollarSign', '#E0A93B'),
  buildMeta('creativity', 'Palette', '#8B5CF6'),
  buildMeta('social', 'Users', '#60A5FA'),
  buildMeta('family', 'Home', '#F472B6'),
  buildMeta('career', 'Briefcase', '#2DD4BF'),
];

/**
 * Resolve the visual metadata for a life area. Custom areas get a synthetic
 * meta from their slug; the area's own DB color/icon (user-chosen) always
 * wins over the catalog defaults.
 */
export function getLifeAreaMeta(
  area: Pick<LifeArea, 'area' | 'color' | 'iconName'>
): LifeAreaMeta {
  const key = String(area.area).toLowerCase();
  const base = LIFE_AREA_CATALOG.find((m) => m.key === key) ?? buildMeta(key, 'Star', '#2DD4BF');
  return {
    ...base,
    color: area.color || base.color,
    iconName: area.iconName || base.iconName,
  };
}
