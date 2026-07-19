/**
 * Avatar Service — AI avatar creation (Nano Banana via Edge Function).
 * React Native port of src/services/supabase/avatar.service.ts: same flow,
 * but images travel as raw PNG bytes + data-URI previews instead of
 * Blobs/objectURLs (no URL.createObjectURL in RN).
 *
 * Flow:
 *   1. generate(photoUri, gender) — compress the user photo + the app's own
 *      style-reference assets, call the `generate-avatar` Edge Function and
 *      post-process the returned magenta-plate renders into transparent
 *      bust/body PNGs for preview.
 *   2. save(generated) — upload both PNGs to the `avatars` storage bucket
 *      under the user's folder and persist the URLs in profiles
 *      (avatar_url = bust, avatar_body_url = full body). Old generated
 *      files are cleaned up best-effort.
 */

import { fromByteArray } from 'base64-js';
import { supabase } from '@/lib/supabase';
import { AVATARS, DEFAULT_HERO_BODY } from '@/constants';
import type { Gender } from '@/types/user';
import {
  assetToImagePart,
  composeBody,
  composeBust,
  photoToImagePart,
  type ImagePart,
} from '@/utils/avatarImage';
import { getAuthUserId } from './utils';

export interface GeneratedAvatar {
  bustBytes: Uint8Array;
  bodyBytes: Uint8Array;
  /** data: URIs for previewing before saving. */
  bustPreviewUrl: string;
  bodyPreviewUrl: string;
  /** API parity with the web (objectURL revoke there); no-op on native. */
  dispose: () => void;
}

export interface SavedAvatar {
  avatarUrl: string;
  avatarBodyUrl: string;
}

/** Error codes surfaced to the UI (mapped to i18n keys by the creator). */
export type AvatarGenerationErrorCode =
  | 'daily_limit_reached'
  | 'photo_rejected'
  | 'generation_failed';

export class AvatarGenerationError extends Error {
  constructor(
    public code: AvatarGenerationErrorCode,
    message?: string
  ) {
    super(message ?? code);
    this.name = 'AvatarGenerationError';
  }
}

/** Style reference assets per player identity (female → Dani, else Rulo). */
function styleRefsFor(gender?: Gender): { bust: string; body: string } {
  if (gender === 'female') {
    return { bust: AVATARS.DANI, body: '/avatars/dani-full.png' };
  }
  return { bust: AVATARS.HERO, body: DEFAULT_HERO_BODY };
}

export class AvatarService {
  /**
   * Generate the stylized bust + full-body renders from a user photo (local
   * gallery/camera URI). Returns transparent PNGs ready to preview and save.
   */
  static async generate(photoUri: string, gender?: Gender): Promise<GeneratedAvatar> {
    const refs = styleRefsFor(gender);
    const [photoPart, styleBust, styleBody] = await Promise.all([
      photoToImagePart(photoUri),
      assetToImagePart(refs.bust),
      assetToImagePart(refs.body),
    ]);

    const { data, error } = await supabase.functions.invoke('generate-avatar', {
      body: { photo: photoPart, styleBust, styleBody, gender },
    });

    if (error) {
      // FunctionsHttpError exposes the raw Response as error.context.
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 429) {
        throw new AvatarGenerationError('daily_limit_reached');
      }
      if (status === 422) {
        // Gemini refused the photo (safety) — a different photo can work.
        throw new AvatarGenerationError('photo_rejected');
      }
      console.error('generate-avatar invoke failed:', error);
      throw new AvatarGenerationError('generation_failed', error.message);
    }

    const { bust, body } = data as { bust: ImagePart; body: ImagePart };
    const [bustBytes, bodyBytes] = await Promise.all([
      composeBust(bust),
      composeBody(body),
    ]);

    return {
      bustBytes,
      bodyBytes,
      bustPreviewUrl: `data:image/png;base64,${fromByteArray(bustBytes)}`,
      bodyPreviewUrl: `data:image/png;base64,${fromByteArray(bodyBytes)}`,
      dispose: () => {},
    };
  }

  /**
   * Persist a generated avatar: upload both PNGs to storage and point the
   * profile at them. Returns the public URLs.
   */
  static async save(generated: GeneratedAvatar): Promise<SavedAvatar> {
    const userId = await getAuthUserId();
    const version = Date.now();
    const bustPath = `${userId}/bust-${version}.png`;
    const bodyPath = `${userId}/body-${version}.png`;

    const bucket = supabase.storage.from('avatars');
    const uploadOptions = {
      contentType: 'image/png',
      cacheControl: '31536000', // versioned filenames — cache forever
      upsert: false,
    };

    const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

    const [bustUpload, bodyUpload] = await Promise.all([
      bucket.upload(bustPath, toArrayBuffer(generated.bustBytes), uploadOptions),
      bucket.upload(bodyPath, toArrayBuffer(generated.bodyBytes), uploadOptions),
    ]);
    if (bustUpload.error || bodyUpload.error) {
      throw new AvatarGenerationError(
        'generation_failed',
        (bustUpload.error ?? bodyUpload.error)?.message
      );
    }

    const avatarUrl = bucket.getPublicUrl(bustPath).data.publicUrl;
    const avatarBodyUrl = bucket.getPublicUrl(bodyPath).data.publicUrl;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, avatar_body_url: avatarBodyUrl })
      .eq('id', userId);
    if (profileError) {
      throw new AvatarGenerationError('generation_failed', profileError.message);
    }

    // Best-effort cleanup of previous generations (never blocks the save).
    // NEVER touch the forged 3D hero: hero-*.glb and the forge/ working
    // folder belong to the Hero Forge feature, not to avatar regeneration.
    try {
      const { data: files } = await bucket.list(userId);
      const stale = (files ?? [])
        .filter((f) => f.name !== 'forge' && !f.name.endsWith('.glb'))
        .map((f) => `${userId}/${f.name}`)
        .filter((path) => path !== bustPath && path !== bodyPath);
      if (stale.length > 0) await bucket.remove(stale);
    } catch (cleanupError) {
      console.warn('Old avatar cleanup failed:', cleanupError);
    }

    return { avatarUrl, avatarBodyUrl };
  }
}
