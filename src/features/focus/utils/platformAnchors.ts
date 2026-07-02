/**
 * Virtual 5×5 grid anchors for the Gem Vault platform scene.
 *
 * ── ASSET ALIGNMENT (same technique as the Dashboard hero) ──
 * The scene container is locked to the image's exact aspect ratio
 * (928×1152), so every anchor is a PERCENTAGE of the container and holds
 * at any width. The four corner TILE CENTERS below were calibrated against
 * public/gems/vault-platform.jpg (dev overlay: vault view + ?debugAnchors);
 * the remaining 23 anchors are bilinearly interpolated. If the scene image
 * is regenerated, recalibrate ONLY these four constants.
 *
 * Grid orientation: row 0 = back edge (the portal sits on its right end),
 * row 4 = front edge (closest to the viewer, bottom-left); col 0 = left.
 */

export const PLATFORM_ASPECT_CLASS = 'aspect-[928/1152]';

interface Point {
  x: number;
  y: number;
}

const CORNERS = {
  /** row 0, col 0 — the tile at the top corner */
  backLeft: { x: 0.536, y: 0.383 } as Point,
  /** row 0, col 4 — the tile at the right corner */
  backRight: { x: 0.843, y: 0.603 } as Point,
  /** row 4, col 0 — the tile at the left corner */
  frontLeft: { x: 0.227, y: 0.603 } as Point,
  /** row 4, col 4 — the tile at the bottom corner */
  frontRight: { x: 0.534, y: 0.812 } as Point,
};

/** The portal-altar arch (latest-gem highlight + duration chip). */
export const PORTAL_ANCHOR = { xPct: 71, yPct: 36 };

export interface TileAnchor {
  xPct: number;
  yPct: number;
  /** Depth cue: back rows render slightly smaller. */
  scale: number;
  row: number;
  col: number;
}

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function anchorFor(row: number, col: number): TileAnchor {
  const t = col / 4;
  const u = row / 4;
  const back = lerp(CORNERS.backLeft, CORNERS.backRight, t);
  const front = lerp(CORNERS.frontLeft, CORNERS.frontRight, t);
  const point = lerp(back, front, u);
  return {
    xPct: point.x * 100,
    yPct: point.y * 100,
    scale: 0.8 + 0.25 * u,
    row,
    col,
  };
}

/**
 * Deterministic tile fill order, front-center outward: with 1-3 gems the
 * scene reads as intentional (the newest gem front and center) instead of
 * clustering in an occluded back corner. The portal stands on the rim
 * beyond the tiles, so all 25 tiles are usable; row 0 (whose middle tiles
 * sit in front of the portal steps) fills last.
 */
export const FILL_ORDER: ReadonlyArray<readonly [number, number]> = [
  [4, 2], [4, 1], [4, 3], [4, 0], [4, 4],
  [3, 2], [3, 1], [3, 3], [3, 0], [3, 4],
  [2, 2], [2, 1], [2, 3], [2, 0], [2, 4],
  [1, 2], [1, 1], [1, 3], [1, 0], [1, 4],
  [0, 2], [0, 1], [0, 3], [0, 0], [0, 4],
];

/** Max sprites the platform can show; overflow becomes the "+N" chip. */
export const MAX_PLATFORM_TILES = FILL_ORDER.length;
