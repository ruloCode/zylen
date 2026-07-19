import { StateCreator } from 'zustand';
import {
  ForgeError,
  ForgeService,
  type ForgeErrorCode,
  type ForgeProgress,
  type HeroForge,
} from '@/services/supabase/forge.service';
import type { AppStore } from './types';

/**
 * Hero Forge state — drives the "forge your 3D arena hero" pipeline.
 * The Edge Function owns the real state machine; this slice mirrors it,
 * runs the resumable pump loop and reflects the final model into the user.
 */
export interface ForgeSlice {
  forge: HeroForge | null;
  forging: boolean;
  forgeProgress: ForgeProgress | null;
  forgeError: ForgeErrorCode | null;
  /** ISO date when re-forging is allowed again (forge_cooldown). */
  forgeRetryAt: string | null;

  /** Load the latest forge and resume the pump if one is in flight. */
  refreshForge: () => Promise<void>;
  /** Start a brand-new forge (or resume the active one on 409). */
  startForge: () => Promise<void>;
  /** Resume pumping an in-flight forge (e.g. after reopening the app). */
  resumeForge: () => Promise<void>;
}

export const createForgeSlice: StateCreator<AppStore, [], [], ForgeSlice> = (
  set,
  get
) => {
  const runPump = async (forge: HeroForge): Promise<void> => {
    if (get().forging) return; // one pump loop at a time
    set({ forging: true, forgeError: null, forge });
    try {
      const done = await ForgeService.pump(forge, get().user?.gender, (p) =>
        set({ forgeProgress: p })
      );
      set({ forge: done, forging: false, forgeProgress: null });
      if (done.modelUrl) {
        get().applyHeroModel(done.modelUrl);
      }
    } catch (error) {
      const code = error instanceof ForgeError ? error.code : 'forge_failed';
      const retryAt = error instanceof ForgeError ? (error.retryAt ?? null) : null;
      console.error('Hero forge failed:', error);
      set((state) => ({
        forging: false,
        forgeProgress: null,
        forgeError: code,
        forgeRetryAt: retryAt,
        forge: state.forge ? { ...state.forge, status: 'failed', errorCode: code } : null,
      }));
    }
  };

  return {
    forge: null,
    forging: false,
    forgeProgress: null,
    forgeError: null,
    forgeRetryAt: null,

    refreshForge: async () => {
      try {
        const forge = await ForgeService.getLatest();
        set({ forge });
        if (forge && forge.status !== 'done' && forge.status !== 'failed') {
          void runPump(forge); // resume in background, don't block the caller
        }
      } catch (error) {
        console.error('Error loading forge:', error);
      }
    },

    startForge: async () => {
      set({ forgeError: null, forgeRetryAt: null });
      try {
        const forge = await ForgeService.start(get().user?.gender);
        await runPump(forge);
      } catch (error) {
        if (error instanceof ForgeError && error.code === 'forge_active_exists') {
          await get().resumeForge();
          return;
        }
        const code = error instanceof ForgeError ? error.code : 'forge_failed';
        const retryAt = error instanceof ForgeError ? (error.retryAt ?? null) : null;
        set({ forgeError: code, forgeRetryAt: retryAt });
      }
    },

    resumeForge: async () => {
      const forge = get().forge ?? (await ForgeService.getLatest());
      if (!forge || forge.status === 'done' || forge.status === 'failed') {
        set({ forge });
        return;
      }
      await runPump(forge);
    },
  };
};
