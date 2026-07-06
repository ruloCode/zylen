/**
 * Arena Service - roguelite progression (tier ladder + gear inventory).
 *
 * All writes go through SECURITY DEFINER RPCs so purchases are atomic
 * (points check + deduct + grant) and gear ownership is validated
 * server-side. See supabase/migrations/20260702120000_arena_progression.sql.
 */

import { supabase } from '@/lib/supabase';

export interface ArenaProgress {
  tier: number;
  weaponId: string;
  gems: string[];
  ownedWeapons: string[];
  ownedGems: string[];
}

interface ArenaProgressRow {
  user_id: string;
  tier: number;
  weapon_id: string;
  gems: string[];
  owned_weapons: string[];
  owned_gems: string[];
}

function mapRow(row: ArenaProgressRow): ArenaProgress {
  return {
    tier: row.tier,
    weaponId: row.weapon_id,
    gems: row.gems ?? [],
    ownedWeapons: row.owned_weapons ?? [],
    ownedGems: row.owned_gems ?? [],
  };
}

export class ArenaService {
  static async getProgress(): Promise<ArenaProgress> {
    const { data, error } = await supabase.rpc('get_arena_progress');
    if (error) throw new Error(`Failed to load arena progress: ${error.message}`);
    return mapRow(data as unknown as ArenaProgressRow);
  }

  /** Atomic purchase; returns the new points balance + updated inventory. */
  static async purchaseItem(
    itemType: 'weapon' | 'gem',
    itemId: string
  ): Promise<{ newPoints: number; ownedWeapons: string[]; ownedGems: string[] }> {
    const { data, error } = await supabase.rpc('purchase_arena_item', {
      p_item_type: itemType,
      p_item_id: itemId,
    });
    if (error) throw new Error(error.message);
    const d = data as unknown as { new_points: number; owned_weapons: string[]; owned_gems: string[] };
    return { newPoints: d.new_points, ownedWeapons: d.owned_weapons, ownedGems: d.owned_gems };
  }

  static async equip(weaponId: string, gems: string[]): Promise<ArenaProgress> {
    const { data, error } = await supabase.rpc('equip_arena_gear', {
      p_weapon_id: weaponId,
      p_gems: gems,
    });
    if (error) throw new Error(error.message);
    return mapRow(data as unknown as ArenaProgressRow);
  }

  /** Registers a tier victory; unlocks tier+1 (never lowers). Returns the new max tier. */
  static async completeTier(tier: number): Promise<number> {
    const { data, error } = await supabase.rpc('complete_arena_tier', { p_tier: tier });
    if (error) throw new Error(error.message);
    return data as number;
  }
}
