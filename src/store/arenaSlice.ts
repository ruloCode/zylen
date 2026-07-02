import { StateCreator } from 'zustand';
import { ArenaService, ArenaProgress } from '@/services/supabase/arena.service';

export interface ArenaSlice {
  arenaProgress: ArenaProgress | null;
  arenaLoading: boolean;
  arenaError: string | null;

  loadArenaProgress: () => Promise<void>;
  purchaseArenaItem: (itemType: 'weapon' | 'gem', itemId: string) => Promise<boolean>;
  equipArenaGear: (weaponId: string, gems: string[]) => Promise<boolean>;
  completeArenaTier: (tier: number) => Promise<number | null>;
}

export const createArenaSlice: StateCreator<ArenaSlice> = (set, get) => ({
  arenaProgress: null,
  arenaLoading: false,
  arenaError: null,

  loadArenaProgress: async () => {
    try {
      set({ arenaLoading: true, arenaError: null });
      const progress = await ArenaService.getProgress();
      set({ arenaProgress: progress, arenaLoading: false });
    } catch (error) {
      console.error('Error loading arena progress:', error);
      set({
        arenaError: error instanceof Error ? error.message : 'Failed to load arena progress',
        arenaLoading: false,
      });
    }
  },

  purchaseArenaItem: async (itemType, itemId) => {
    try {
      set({ arenaError: null });
      const result = await ArenaService.purchaseItem(itemType, itemId);
      const prev = get().arenaProgress;
      if (prev) {
        set({
          arenaProgress: {
            ...prev,
            ownedWeapons: result.ownedWeapons,
            ownedGems: result.ownedGems,
          },
        });
      }
      // points changed server-side atomically — sync the user slice counter
      // (slices share one flat store, so cross-slice set is safe)
      const s = get() as unknown as { user: { points: number } | null };
      if (s.user) set({ user: { ...s.user, points: result.newPoints } } as never);
      return true;
    } catch (error) {
      set({ arenaError: error instanceof Error ? error.message : 'purchase_failed' });
      return false;
    }
  },

  equipArenaGear: async (weaponId, gems) => {
    try {
      set({ arenaError: null });
      const progress = await ArenaService.equip(weaponId, gems);
      set({ arenaProgress: progress });
      return true;
    } catch (error) {
      set({ arenaError: error instanceof Error ? error.message : 'equip_failed' });
      return false;
    }
  },

  completeArenaTier: async (tier) => {
    try {
      const newTier = await ArenaService.completeTier(tier);
      const prev = get().arenaProgress;
      if (prev) set({ arenaProgress: { ...prev, tier: newTier } });
      return newTier;
    } catch (error) {
      console.error('Error completing arena tier:', error);
      return null;
    }
  },
});
