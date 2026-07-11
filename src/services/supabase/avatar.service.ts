/**
 * Avatar Service — AI avatar creation (Nano Banana via Edge Function)
 *
 * Flow:
 *   1. generate(photo, gender) — compress the user photo + the app's own
 *      style-reference assets, call the `generate-avatar` Edge Function
 *      (secure Gemini proxy) and post-process the returned magenta-plate
 *      renders into transparent bust/body PNG blobs for preview.
 *   2. save(generated) — upload both PNGs to the `avatars` storage bucket
 *      under the user's folder and persist the URLs in profiles
 *      (avatar_url = bust, avatar_body_url = full body). Old generated
 *      files are cleaned up best-effort.
 */

import { supabase } from '@/lib/supabase';
import { AVATARS, DEFAULT_HERO_BODY } from '@/constants';
import type { Gender } from '@/types/user';
import {
  assetToImagePart,
  composeBody,
  composeBust,
  fileToImagePart,
  type ImagePart,
} from '@/utils/avatarImage';
import { getAuthUserId } from './utils';

export interface GeneratedAvatar {
  bustBlob: Blob;
  bodyBlob: Blob;
  /** Object URLs for previewing before saving. Revoke via dispose(). */
  bustPreviewUrl: string;
  bodyPreviewUrl: string;
  dispose: () => void;
}

export interface SavedAvatar {
  avatarUrl: string;
  avatarBodyUrl: string;
}

/** Error codes surfaced to the UI (mapped to i18n keys by the creator). */
export type AvatarGenerationErrorCode =
  | 'daily_limit_reached'
  | 'generation_failed';

export class AvatarGenerationError extends Error {
  constructor(public code: AvatarGenerationErrorCode, message?: string) {
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
   * Generate the stylized bust + full-body renders from a user photo.
   * Returns transparent PNG blobs ready to preview and save.
   */
  static async generate(photo: File, gender?: Gender): Promise<GeneratedAvatar> {
    const refs = styleRefsFor(gender);
    const [photoPart, styleBust, styleBody] = await Promise.all([
      fileToImagePart(photo),
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
      console.error('generate-avatar invoke failed:', error);
      throw new AvatarGenerationError('generation_failed', error.message);
    }

    const { bust, body } = data as { bust: ImagePart; body: ImagePart };
    const [bustBlob, bodyBlob] = await Promise.all([
      composeBust(bust),
      composeBody(body),
    ]);

    const bustPreviewUrl = URL.createObjectURL(bustBlob);
    const bodyPreviewUrl = URL.createObjectURL(bodyBlob);
    return {
      bustBlob,
      bodyBlob,
      bustPreviewUrl,
      bodyPreviewUrl,
      dispose: () => {
        URL.revokeObjectURL(bustPreviewUrl);
        URL.revokeObjectURL(bodyPreviewUrl);
      },
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

    const [bustUpload, bodyUpload] = await Promise.all([
      bucket.upload(bustPath, generated.bustBlob, uploadOptions),
      bucket.upload(bodyPath, generated.bodyBlob, uploadOptions),
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
    try {
      const { data: files } = await bucket.list(userId);
      const stale = (files ?? [])
        .map((f) => `${userId}/${f.name}`)
        .filter((path) => path !== bustPath && path !== bodyPath);
      if (stale.length > 0) await bucket.remove(stale);
    } catch (cleanupError) {
      console.warn('Old avatar cleanup failed:', cleanupError);
    }

    return { avatarUrl, avatarBodyUrl };
  }
}
