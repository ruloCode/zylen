/**
 * Arena gear catalog — the single source of truth for ids, costs and stats on
 * the client. Costs are ALSO embedded server-side in `arena_item_cost()`
 * (supabase/migrations/20260702120000_arena_progression.sql): the RPC never
 * trusts a client-sent price. Keep both in sync when adding items.
 *
 * The game mirrors the stat tables in its own `GEAR` const (everlight-game
 * server.js) — ids travel via the iframe URL, stats are resolved there.
 */

export interface ArenaWeapon {
  id: string;
  cost: number;
  /** damage multiplier over the base staff */
  dmg: number;
  /** attack cooldown multiplier (lower = faster) */
  atkCd: number;
  emoji: string;
}

export interface ArenaGem {
  id: string;
  cost: number;
  emoji: string;
}

export const ARENA_WEAPONS: ArenaWeapon[] = [
  { id: 'staff_novice', cost: 0, dmg: 1, atkCd: 1, emoji: '🪄' },
  { id: 'staff_adept', cost: 300, dmg: 1.3, atkCd: 1, emoji: '🦯' },
  { id: 'staff_guardian', cost: 800, dmg: 1.6, atkCd: 0.9, emoji: '⚚' },
  { id: 'staff_everlight', cost: 2000, dmg: 2, atkCd: 0.8, emoji: '✨' },
];

export const ARENA_GEMS: ArenaGem[] = [
  { id: 'vitality', cost: 150, emoji: '💚' },
  { id: 'swift', cost: 150, emoji: '💨' },
  { id: 'wisdom', cost: 250, emoji: '🔮' },
  { id: 'wrath', cost: 400, emoji: '💥' },
  { id: 'haste', cost: 500, emoji: '⚡' },
  { id: 'leech', cost: 600, emoji: '🩸' },
];

export const MAX_EQUIPPED_GEMS = 2;
export const MAX_ARENA_TIER = 50;

/** Reward scaling per arena tier (applied to GAME_CONFIG.victoryXP/Points). */
export function tierRewardMultiplier(tier: number): number {
  return 1 + 0.2 * (Math.max(1, tier) - 1);
}
