/**
 * Moderation Service — bloqueo de usuarios y denuncias de contenido
 * (compliance con la política UGC de Google Play).
 *
 * Bloquear rompe la alianza en ambas direcciones en el servidor (block_user),
 * lo que cierra chat nuevo, posts y feed automáticamente; el gate de
 * send_friend_request impide que el bloqueado vuelva a solicitar alianza.
 */

import { supabase } from '@/lib/supabase';

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other';
export type ReportContentType = 'message' | 'post' | 'profile';

export interface BlockedUser {
  userId: string;
  username: string;
  avatarUrl?: string;
  blockedAt: Date;
}

/** Bloquea a un usuario y elimina la alianza/solicitudes en ambas direcciones. */
export async function blockUser(blockedId: string): Promise<void> {
  const { error } = await supabase.rpc('block_user', { p_blocked_id: blockedId });
  if (error) {
    console.error('Error blocking user:', error);
    // Propagar el mensaje del servidor (blocked, rate_limited…) para que la
    // UI pueda mapearlo a un texto propio.
    throw new Error(error.message || 'Failed to block user');
  }
}

/** Levanta un bloqueo (no restaura la alianza — habría que re-solicitarla). */
export async function unblockUser(blockedId: string): Promise<void> {
  const { error } = await supabase.rpc('unblock_user', { p_blocked_id: blockedId });
  if (error) {
    console.error('Error unblocking user:', error);
    throw new Error(error.message || 'Failed to unblock user');
  }
}

/** Lista de usuarios bloqueados por el usuario actual. */
export async function getBlockedUsers(): Promise<BlockedUser[]> {
  const { data, error } = await supabase.rpc('get_blocked_users');
  if (error) {
    console.error('Error fetching blocked users:', error);
    throw new Error(error.message || 'Failed to fetch blocked users');
  }
  return (data ?? []).map((row) => ({
    userId: row.blocked_id,
    username: row.username,
    avatarUrl: row.avatar_url ?? undefined,
    blockedAt: new Date(row.blocked_at),
  }));
}

/**
 * Denuncia contenido o un usuario. Devuelve el id de la denuncia.
 * El servidor aplica rate-limit (20/24h) y avisa al admin por push.
 */
export async function reportContent(params: {
  reportedUserId: string;
  contentType: ReportContentType;
  contentId?: string;
  reason: ReportReason;
  details?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('report_content', {
    p_reported_user_id: params.reportedUserId,
    p_content_type: params.contentType,
    p_content_id: params.contentId,
    p_reason: params.reason,
    p_details: params.details ?? '',
  });
  if (error) {
    console.error('Error reporting content:', error);
    throw new Error(error.message || 'Failed to report content');
  }
  return data as string;
}
