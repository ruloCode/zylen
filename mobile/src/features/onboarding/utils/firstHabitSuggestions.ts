import type { HabitTemplate } from '@/types';
import { findCatalogEntry } from '@/constants/habitCatalog';

/** A template resolved against the player's enabled areas + display name. */
export interface FirstHabitCandidate {
  tpl: HabitTemplate;
  areaId: string;
  /** i18n-resolved display name (used for catalog matching and rendering) */
  name: string;
}

/**
 * motivation → catalog slugs, best first. Slugs come from HABIT_CATALOG;
 * matching is by normalized name so it works for template and custom names.
 */
const MOTIVATION_SLUGS: Record<string, string[]> = {
  health: ['exercise', 'hydration', 'sleep', 'nutrition'],
  focus: ['deep-work', 'meditation', 'planning'],
  productivity: ['planning', 'deep-work', 'study'],
  wellbeing: ['meditation', 'journaling', 'sleep', 'gratitude'],
  discipline: ['exercise', 'planning', 'reading'],
};

/**
 * Rank first-habit suggestions by the motivation the player just tapped:
 * catalog matches for that motivation float to the top (in slug order),
 * then featured templates, then popularity. Deduped by display name.
 */
export function rankFirstHabitSuggestions(
  candidates: FirstHabitCandidate[],
  motivation: string | undefined,
  limit = 6
): FirstHabitCandidate[] {
  const preferred = (motivation && MOTIVATION_SLUGS[motivation]) || [];

  const scored = candidates.map((candidate) => {
    const slug = findCatalogEntry(candidate.name)?.slug ?? null;
    const slugIndex = slug ? preferred.indexOf(slug) : -1;
    const motivationScore = slugIndex >= 0 ? (preferred.length - slugIndex) * 1000 : 0;
    const featuredScore = candidate.tpl.isFeatured ? 100 : 0;
    const popularityScore = Math.min(candidate.tpl.popularity ?? 0, 99);
    return { candidate, score: motivationScore + featuredScore + popularityScore };
  });

  scored.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const ranked: FirstHabitCandidate[] = [];
  for (const { candidate } of scored) {
    const key = candidate.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ranked.push(candidate);
    if (ranked.length >= limit) break;
  }
  return ranked;
}
