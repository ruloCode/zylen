/**
 * Progress Posts Service — fotos de progreso y fotos de chat.
 *
 * El bucket `progress-photos` es PRIVADO (las fotos de proceso son
 * sensibles): las escrituras van a la carpeta propia y la lectura se hace
 * con signed URLs (RLS: dueño + aliados para posts; miembros para chat).
 *
 * Pipeline de subida: URI local (cámara/galería) → resize al lado largo
 * ≤1440px + JPEG 0.8 (expo-image-manipulator, misma API que avatarImage) →
 * upload de bytes → path relativo que viaja por RPC (jamás URLs en la BD).
 */

import { Image as RNImage } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { toByteArray } from 'base64-js';
import { supabase } from '@/lib/supabase';
import type { PostReactionKind } from '@/types/community';
import { getAuthUserId } from './utils';

const BUCKET = 'progress-photos';
const MAX_DIM = 1440;
const SIGNED_URL_TTL = 60 * 60 * 24; // 24h

function getSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(err instanceof Error ? err : new Error(String(err)))
    );
  });
}

/** Comprime una foto local a JPEG con lado largo ≤{@link MAX_DIM}. */
async function compressPhoto(uri: string): Promise<Uint8Array> {
  let resize: { width: number } | { height: number } | null = { width: MAX_DIM };
  try {
    const { width, height } = await getSize(uri);
    if (Math.max(width, height) <= MAX_DIM) {
      resize = null; // ya es pequeña — solo recomprimir
    } else if (height > width) {
      resize = { height: MAX_DIM };
    }
  } catch {
    // dimensiones desconocidas — resize por ancho como default seguro
  }

  const ctx = ImageManipulator.manipulate(uri);
  if (resize) ctx.resize(resize);
  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.8,
    base64: true,
  });
  if (!saved.base64) throw new Error('Photo compression produced no data');
  return toByteArray(saved.base64);
}

async function uploadTo(path: string, bytes: Uint8Array): Promise<void> {
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: 'image/jpeg',
    cacheControl: '31536000', // filenames versionados por timestamp
    upsert: false,
  });
  if (error) throw new Error(error.message);
}

/** Sube una foto de progreso a la carpeta propia; devuelve su path. */
export async function uploadPostPhoto(uri: string): Promise<string> {
  const userId = await getAuthUserId();
  const bytes = await compressPhoto(uri);
  const path = `${userId}/posts/${Date.now()}.jpg`;
  await uploadTo(path, bytes);
  return path;
}

/** Sube una foto de chat a la carpeta de la conversación; devuelve su path. */
export async function uploadChatPhoto(
  conversationId: string,
  uri: string
): Promise<string> {
  const userId = await getAuthUserId();
  const bytes = await compressPhoto(uri);
  const path = `chat/${conversationId}/${userId}-${Date.now()}.jpg`;
  await uploadTo(path, bytes);
  return path;
}

export interface CreatePostResult {
  ok: boolean;
  postId?: string;
  reason?: string;
  /** Bonus de evidencia (post ligado a un hábito completado hoy). */
  bonusXP: number;
  bonusPoints: number;
  newPoints?: number;
  newTotalXP?: number;
  newLevel?: number;
  leveledUp?: boolean;
}

export async function createProgressPost(
  imagePath: string,
  caption: string,
  habitId?: string
): Promise<CreatePostResult> {
  const { data, error } = await supabase.rpc('create_progress_post', {
    p_image_path: imagePath,
    p_caption: caption,
    p_habit_id: habitId,
  });
  if (error) {
    console.error('Error creating progress post:', error);
    throw new Error('Failed to create progress post');
  }
  const result = data as unknown as {
    ok: boolean;
    post_id?: string;
    reason?: string;
    bonus_xp?: number;
    bonus_points?: number;
    new_points?: number | null;
    new_total_xp?: number | null;
    new_level?: number | null;
    leveled_up?: boolean;
  };
  return {
    ok: result?.ok ?? false,
    postId: result?.post_id,
    reason: result?.reason,
    bonusXP: result?.bonus_xp ?? 0,
    bonusPoints: result?.bonus_points ?? 0,
    newPoints: result?.new_points ?? undefined,
    newTotalXP: result?.new_total_xp ?? undefined,
    newLevel: result?.new_level ?? undefined,
    leveledUp: result?.leveled_up ?? false,
  };
}

export interface VerifyPostResult {
  ok: boolean;
  reason?: string;
  authorBonusXP: number;
  verifierBonusXP: number;
  newPoints?: number;
  newTotalXP?: number;
  newLevel?: number;
}

/** Verifica la evidencia de un aliado (bonus para ambos, ver migración). */
export async function verifyProgressPost(postId: string): Promise<VerifyPostResult> {
  const { data, error } = await supabase.rpc('verify_progress_post', {
    p_post_id: postId,
  });
  if (error) {
    console.error('Error verifying progress post:', error);
    throw new Error('Failed to verify progress post');
  }
  const result = data as unknown as {
    ok: boolean;
    reason?: string;
    author_bonus_xp?: number;
    verifier_bonus_xp?: number;
    new_points?: number;
    new_total_xp?: number;
    new_level?: number;
  };
  return {
    ok: result?.ok ?? false,
    reason: result?.reason,
    authorBonusXP: result?.author_bonus_xp ?? 0,
    verifierBonusXP: result?.verifier_bonus_xp ?? 0,
    newPoints: result?.new_points ?? undefined,
    newTotalXP: result?.new_total_xp ?? undefined,
    newLevel: result?.new_level ?? undefined,
  };
}

/** Borra un post propio; limpia el objeto de storage best-effort. */
export async function deleteProgressPost(
  postId: string,
  imagePath?: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('delete_progress_post', {
    p_post_id: postId,
  });
  if (error) {
    console.error('Error deleting progress post:', error);
    throw new Error('Failed to delete progress post');
  }
  const ok = (data as unknown as { ok?: boolean })?.ok ?? false;
  if (ok && imagePath) {
    supabase.storage
      .from(BUCKET)
      .remove([imagePath])
      .catch((err) => console.warn('Post photo cleanup failed:', err));
  }
  return ok;
}

export type ReactionState = 'added' | 'changed' | 'removed';

export async function reactToPost(
  postId: string,
  reaction: PostReactionKind
): Promise<ReactionState | null> {
  const { data, error } = await supabase.rpc('react_to_post', {
    p_post_id: postId,
    p_reaction: reaction,
  });
  if (error) {
    console.error('Error reacting to post:', error);
    throw new Error('Failed to react to post');
  }
  const result = data as unknown as { ok: boolean; state?: ReactionState };
  return result?.ok ? (result.state ?? null) : null;
}

// --- Signed URLs (con caché en memoria) -------------------------------------

const signedCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Firma un lote de paths (una sola llamada por página de feed) y devuelve
 * path → URL. Cachea hasta 5 min antes de expirar; `expo-image` con
 * `cacheKey: path` mantiene el caché de disco pese a la rotación de firmas.
 */
export async function signPhotoUrls(paths: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const now = Date.now();
  const missing: string[] = [];

  for (const path of paths) {
    const cached = signedCache.get(path);
    if (cached && cached.expiresAt - 5 * 60 * 1000 > now) {
      result.set(path, cached.url);
    } else {
      missing.push(path);
    }
  }
  if (missing.length === 0) return result;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(missing, SIGNED_URL_TTL);
  if (error) {
    console.error('Error signing photo URLs:', error);
    return result;
  }
  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) {
      signedCache.set(entry.path, {
        url: entry.signedUrl,
        expiresAt: now + SIGNED_URL_TTL * 1000,
      });
      result.set(entry.path, entry.signedUrl);
    }
  }
  return result;
}

/** Conveniencia para una sola foto (mensajes de chat). */
export async function signPhotoUrl(path: string): Promise<string | undefined> {
  const map = await signPhotoUrls([path]);
  return map.get(path);
}
