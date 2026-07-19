/**
 * Forge Service — Hero Forge (avatar → rigged 3D arena hero via Meshy).
 * React Native port of ../src/services/supabase/forge.service.ts.
 *
 * The heavy lifting happens in the `forge-hero` Edge Function, a persisted
 * state machine (table hero_forges). This service:
 *   1. start()            — creates the forge (server enforces 1 active +
 *                           7-day cooldown after a success)
 *   2. generateRigSheet() — renders the A-pose sheet (generate-avatar
 *                           mode:'rig'), chroma-keys it and uploads it to
 *                           avatars/{uid}/forge/{id}/rig.png
 *   3. pump()             — polls advance() until Meshy finishes; when the
 *                           4 GLBs are re-hosted, merges them ON DEVICE
 *                           (glbMerge) into one multi-clip hero GLB, uploads
 *                           avatars/{uid}/hero-{ts}.glb and closes the forge
 *
 * pump() is resumable: closing the app mid-forge and calling pump() again
 * later continues from the persisted state.
 *
 * RN divergences from the web version:
 *   - avatarImage is imported statically (no dynamic import in Hermes builds);
 *   - uploads send raw PNG/GLB bytes (Uint8Array → ArrayBuffer) instead of
 *     Blob — RN's Blob has no .arrayBuffer().
 */

import { supabase } from '@/lib/supabase';
import { DEFAULT_HERO_BODY } from '@/constants';
import type { Gender } from '@/types/user';
import { assetToImagePart, composeRigSheet, type ImagePart } from '@/utils/avatarImage';
import { mergeHeroGlb } from '@/utils/glbMerge';
import { getAuthUserId } from './utils';

export type ForgeStatus =
  | 'rig_image'
  | 'meshy_model'
  | 'meshy_rig'
  | 'meshy_anim'
  | 'downloading'
  | 'merging'
  | 'done'
  | 'failed';

/** UI progress stages (i18n keys under profile.forge.stages). */
export type ForgeStage = 'sheet' | 'model' | 'skeleton' | 'anims' | 'download' | 'merge';

export type ForgeErrorCode =
  | 'no_avatar'
  | 'forge_active_exists'
  | 'forge_cooldown'
  | 'meshy_model_failed'
  | 'meshy_rig_failed'
  | 'meshy_anim_failed'
  | 'meshy_credits_exhausted'
  | 'download_failed'
  | 'merge_failed'
  | 'sheet_failed'
  | 'forge_failed';

export class ForgeError extends Error {
  constructor(
    public code: ForgeErrorCode,
    public retryAt?: string,
    message?: string
  ) {
    super(message ?? code);
    this.name = 'ForgeError';
  }
}

export interface HeroForge {
  id: string;
  status: ForgeStatus;
  errorCode?: ForgeErrorCode;
  modelUrl?: string;
  createdAt: string;
  completedAt?: string;
}

interface ForgeRow {
  id: string;
  status: ForgeStatus;
  error_code: string | null;
  model_url: string | null;
  created_at: string;
  completed_at: string | null;
}

interface AdvanceResponse {
  forge: ForgeRow;
  done?: boolean;
  waiting?: boolean;
  progress?: { stage: string; pct: number };
  urls?: Record<string, string>;
}

export interface ForgeProgress {
  stage: ForgeStage;
  pct: number;
}

const STATUS_STAGE: Partial<Record<ForgeStatus, ForgeStage>> = {
  rig_image: 'sheet',
  meshy_model: 'model',
  meshy_rig: 'skeleton',
  meshy_anim: 'anims',
  downloading: 'download',
  merging: 'merge',
};

/** Clips merged into the final hero GLB — names must match the game's
 * pickClip regexes (/idle/i, /run|walk/i, /attack|cast|spell/i). */
const CLIP_KEYS = [
  { key: 'idle', clipName: 'Idle' },
  { key: 'run', clipName: 'Run' },
  { key: 'attack', clipName: 'Attack' },
] as const;

const PUMP_INTERVAL_MS = 15_000;

function mapForge(row: ForgeRow): HeroForge {
  return {
    id: row.id,
    status: row.status,
    errorCode: (row.error_code as ForgeErrorCode) ?? undefined,
    modelUrl: row.model_url ?? undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
  };
}

/** Exact-length ArrayBuffer for supabase upload (a Uint8Array may be a view). */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) {
    return bytes.buffer as ArrayBuffer;
  }
  return bytes.slice().buffer as ArrayBuffer;
}

async function invokeForge(body: Record<string, unknown>): Promise<AdvanceResponse> {
  const { data, error } = await supabase.functions.invoke('forge-hero', { body });
  if (error) {
    // FunctionsHttpError exposes the raw Response as error.context.
    const ctx = (error as { context?: Response }).context;
    let detail: { error?: string; retryAt?: string; forge?: ForgeRow } = {};
    try {
      detail = ctx ? await ctx.json() : {};
    } catch {
      /* non-JSON error body */
    }
    const code = (detail.error as ForgeErrorCode) ?? 'forge_failed';
    throw new ForgeError(code, detail.retryAt, error.message);
  }
  if ((data as { error?: string })?.error) {
    const d = data as { error: string; retryAt?: string };
    throw new ForgeError(d.error as ForgeErrorCode, d.retryAt);
  }
  return data as AdvanceResponse;
}

export class ForgeService {
  /** Latest forge for the current user (RLS-scoped SELECT), or null. */
  static async getLatest(): Promise<HeroForge | null> {
    const { data, error } = await supabase
      .from('hero_forges')
      .select('id, status, error_code, model_url, created_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return mapForge(data as ForgeRow);
  }

  /** Create a new forge. Throws ForgeError (forge_cooldown carries retryAt;
   * forge_active_exists means "resume the active one instead"). */
  static async start(gender?: Gender): Promise<HeroForge> {
    const res = await invokeForge({ action: 'start', gender });
    return mapForge(res.forge);
  }

  /**
   * Render + upload the A-pose rig sheet for a forge in `rig_image` state,
   * then hand the path to the state machine (starts Meshy image-to-3d).
   */
  static async generateRigSheet(forge: HeroForge, gender?: Gender): Promise<void> {
    const userId = await getAuthUserId();

    // The rig prompt anchors identity on the user's stylized bust and the
    // outfit language on the same style ref the avatar creator uses.
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();
    if (!profile?.avatar_url) throw new ForgeError('no_avatar');

    const styleBodyUrl = gender === 'female' ? '/avatars/dani-full.png' : DEFAULT_HERO_BODY;
    const [bust, styleBody] = await Promise.all([
      assetToImagePart(profile.avatar_url, 768),
      assetToImagePart(styleBodyUrl),
    ]);

    const { data, error } = await supabase.functions.invoke('generate-avatar', {
      body: { mode: 'rig', bust, styleBody, gender },
    });
    if (error || !(data as { rig?: ImagePart })?.rig) {
      throw new ForgeError('sheet_failed', undefined, error?.message);
    }

    const sheetBytes = await composeRigSheet((data as { rig: ImagePart }).rig);
    const path = `${userId}/forge/${forge.id}/rig.png`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, toArrayBuffer(sheetBytes), { contentType: 'image/png', upsert: true });
    if (uploadError) {
      throw new ForgeError('sheet_failed', undefined, uploadError.message);
    }

    await invokeForge({ action: 'advance', forgeId: forge.id, rigImagePath: path });
  }

  /** Download the 4 re-hosted GLBs, merge them on device, upload the
   * final hero GLB and close the forge. Returns the public model URL. */
  static async mergeAndUpload(
    forgeId: string,
    urls: Record<string, string>
  ): Promise<string> {
    const userId = await getAuthUserId();
    try {
      const fetchGlb = async (url: string | undefined): Promise<ArrayBuffer> => {
        if (!url) throw new Error('missing GLB url');
        const res = await fetch(url);
        if (!res.ok) throw new Error(`GLB fetch HTTP ${res.status}`);
        return res.arrayBuffer();
      };
      const base = await fetchGlb(urls.base);
      const clips = [];
      for (const { key, clipName } of CLIP_KEYS) {
        clips.push({ data: await fetchGlb(urls[key]), clipName });
      }
      const merged = mergeHeroGlb(base, clips);

      const path = `${userId}/hero-${Date.now()}.glb`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, toArrayBuffer(merged), {
          contentType: 'model/gltf-binary',
          cacheControl: '31536000', // versioned filename — cache forever
          upsert: false,
        });
      if (uploadError) throw new Error(uploadError.message);

      const res = await invokeForge({ action: 'advance', forgeId, modelPath: path });
      return res.forge.model_url ?? '';
    } catch (e) {
      // Tell the server so the forge doesn't hang in `merging` forever.
      await invokeForge({ action: 'fail', forgeId, code: 'merge_failed' }).catch(() => {});
      throw new ForgeError('merge_failed', undefined, String(e));
    }
  }

  /**
   * Drive the forge to completion from ANY state (resumable). Calls
   * onProgress on every stage change; resolves with the finished forge.
   */
  static async pump(
    forge: HeroForge,
    gender: Gender | undefined,
    onProgress: (p: ForgeProgress) => void
  ): Promise<HeroForge> {
    let current = forge;

    if (current.status === 'rig_image') {
      onProgress({ stage: 'sheet', pct: 0 });
      await this.generateRigSheet(current, gender);
    }

    // Poll until Meshy + downloads finish (or the forge dies).
    for (;;) {
      const res = await invokeForge({ action: 'advance', forgeId: current.id });
      current = mapForge(res.forge);

      if (current.status === 'failed') {
        throw new ForgeError(current.errorCode ?? 'forge_failed');
      }
      if (current.status === 'done') return current;

      if (current.status === 'merging' && res.urls?.base) {
        onProgress({ stage: 'merge', pct: 0 });
        const modelUrl = await this.mergeAndUpload(current.id, res.urls);
        return { ...current, status: 'done', modelUrl };
      }

      onProgress({
        stage: STATUS_STAGE[current.status] ?? 'model',
        pct: res.progress?.pct ?? 0,
      });
      await new Promise((r) => setTimeout(r, PUMP_INTERVAL_MS));
    }
  }
}
