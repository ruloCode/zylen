/**
 * displayGemName — resolves a stored gem name for rendering.
 *
 * The starter gem is persisted with the sentinel key 'focus.starterGem' so it
 * can be translated at render time; legacy rows stored the resolved string
 * ('Enfoque'/'Focus'), so those map back to the same key.
 */

import type { TFunction } from 'i18next';

const STARTER_GEM_KEY = 'focus.starterGem';
const STARTER_GEM_NAMES = new Set<string>([STARTER_GEM_KEY, 'Enfoque', 'Focus']);

export function displayGemName(name: string, t: TFunction): string {
  return STARTER_GEM_NAMES.has(name) ? t(STARTER_GEM_KEY) : name;
}
