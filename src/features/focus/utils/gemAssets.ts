/**
 * Gem artwork + Arena buff-param helpers. Stage->file mapping lives only
 * here; components never build paths by hand.
 */

import type { GemSpecies, SpeciesCounts } from '@/types/focus';
import { GEM_SPECIES } from '@/types/focus';
import {
  LIFE_AREA_CATALOG,
  type LifeAreaMeta,
} from '@/constants/lifeAreaCatalog';

export type GemStage = 1 | 2 | 3 | 4;

/** Species share their key with the life-area catalog (color/icon/i18n). */
export function speciesMeta(species: GemSpecies): LifeAreaMeta {
  return (
    LIFE_AREA_CATALOG.find((m) => m.key === species) ?? LIFE_AREA_CATALOG[0]
  );
}

export function gemStageImage(species: GemSpecies, stage: GemStage): string {
  return `/gems/${species}-stage-${stage}.png`;
}

export const GEM_BROKEN_IMAGE = '/gems/broken.png';
export const FOCUS_BG_IMAGE = '/gems/focus-bg.jpg';
export const VAULT_PLATFORM_IMAGE = '/gems/vault-platform.jpg';

/** Growth stage for a 0..1 session progress (thresholds 0/.25/.55/.85). */
export function stageForProgress(fraction: number): GemStage {
  if (fraction >= 0.85) return 4;
  if (fraction >= 0.55) return 3;
  if (fraction >= 0.25) return 2;
  return 1;
}

/**
 * Encode completed-gem counts as the Arena iframe param:
 * `health:4,career:2` (only species with count > 0; '' when empty).
 */
export function encodeGems(counts: SpeciesCounts): string {
  return GEM_SPECIES.filter((s) => (counts[s] ?? 0) > 0)
    .map((s) => `${s}:${Math.min(99, counts[s] ?? 0)}`)
    .join(',');
}

export function totalGems(counts: SpeciesCounts): number {
  return GEM_SPECIES.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
}
