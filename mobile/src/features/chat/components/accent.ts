/**
 * Chat accent palette — RN port helper.
 *
 * The web tints chat chrome with Tailwind gradient utilities
 * (`from-gold-500 to-gold-600` / `from-teal-500 to-teal-600`). On native,
 * `LinearGradient` and markdown styles need concrete color strings, so this
 * hook resolves them: gold is a static brand ramp (same HSL values as the
 * web tailwind config), while teal follows the active theme's `--accent-*`
 * ramp via {@link themeHsl} — matching how NativeWind resolves `teal-*`.
 */

import { useAppStore } from '@/store';
import { themeHsl } from '@/theme/themeVars';

export type ChatAccent = 'teal' | 'gold';

export interface AccentColors {
  /** Gradient start (≈ `from-{accent}-500`). */
  from: string;
  /** Gradient end (≈ `to-{accent}-600`). */
  to: string;
  /** Light tint for links / icons / dots (≈ `{accent}-400`). */
  soft: string;
  /** Halo gradient for the empty-state avatar (`500/30 → 600/10`). */
  halo: [string, string];
  /** Soft glow behind the empty-state avatar (`500/20`). */
  glow: string;
}

const GOLD: AccentColors = {
  from: 'hsl(38, 95%, 52%)',
  to: 'hsl(34, 92%, 46%)',
  soft: 'hsl(40, 95%, 58%)',
  halo: ['hsla(38, 95%, 52%, 0.3)', 'hsla(34, 92%, 46%, 0.1)'],
  glow: 'hsla(38, 95%, 52%, 0.2)',
};

/** Resolves the concrete colors for a chat accent under the active theme. */
export function useAccent(accent: ChatAccent): AccentColors {
  const theme = useAppStore((state) => state.theme);
  if (accent === 'gold') return GOLD;
  return {
    from: themeHsl(theme, '--accent-500'),
    to: themeHsl(theme, '--accent-600'),
    soft: themeHsl(theme, '--accent-400'),
    halo: [themeHsl(theme, '--accent-500', 0.3), themeHsl(theme, '--accent-600', 0.1)],
    glow: themeHsl(theme, '--accent-500', 0.2),
  };
}
