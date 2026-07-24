/**
 * Ally Chat Service — DMs entre aliados sobre Supabase.
 *
 * Todas las escrituras pasan por RPCs SECURITY DEFINER (get_or_create_dm /
 * send_message / mark_conversation_read); las lecturas por get_conversations
 * y get_messages (paginación cursor). La entrega en vivo usa Supabase
 * Realtime (postgres_changes) SOLO sobre la conversación abierta: la RLS de
 * SELECT de `messages` autoriza qué filas ve el socket.
 */

import { supabase } from '@/lib/supabase';
import type { AllyMessage, Conversation } from '@/types/allyChat';

function mapMessageRow(row: any, conversationId: string): AllyMessage {
  return {
    id: row.id,
    conversationId,
    senderId: row.sender_id,
    kind: row.kind === 'image' ? 'image' : 'text',
    body: row.body ?? '',
    imagePath: row.image_path ?? undefined,
    createdAt: new Date(row.created_at),
    status: 'sent',
  };
}

/** Abre (o encuentra) el DM con un aliado; devuelve el conversation_id. */
export async function getOrCreateDm(friendId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_dm', {
    p_friend_id: friendId,
  });
  if (error) {
    console.error('Error opening DM:', error);
    throw new Error(error.message.includes('not_allies') ? 'not_allies' : 'dm_failed');
  }
  return data as string;
}

/** Conversaciones del usuario con último mensaje y unread count. */
export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc('get_conversations');
  if (error) {
    console.error('Error fetching conversations:', error);
    throw new Error('Failed to fetch conversations');
  }
  return (data || []).map((row: any) => ({
    conversationId: row.conversation_id,
    kind: row.kind === 'mission' ? 'mission' : 'dm',
    otherUserId: row.other_user_id ?? undefined,
    otherUsername: row.other_username ?? undefined,
    otherAvatarUrl: row.other_avatar_url ?? undefined,
    otherLastActiveAt: row.other_last_active_at
      ? new Date(row.other_last_active_at)
      : undefined,
    lastMessageKind: row.last_message_kind ?? undefined,
    lastMessageBody: row.last_message_body ?? undefined,
    lastMessageSenderId: row.last_message_sender_id ?? undefined,
    lastMessageAt: row.last_message_at ? new Date(row.last_message_at) : undefined,
    unreadCount: row.unread_count ?? 0,
  }));
}

/**
 * Mensajes de una conversación, newest-first (el caller decide el orden de
 * render); `before` pagina hacia atrás con el createdAt del más viejo.
 */
export async function getMessages(
  conversationId: string,
  limit: number = 50,
  before?: Date
): Promise<AllyMessage[]> {
  const { data, error } = await supabase.rpc('get_messages', {
    p_conversation_id: conversationId,
    p_limit: limit,
    p_before: before?.toISOString(),
  });
  if (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to fetch messages');
  }
  return (data || []).map((row: any) => mapMessageRow(row, conversationId));
}

/**
 * Envía un mensaje. Devuelve { id, createdAt } del servidor para reconciliar
 * el mensaje optimista del slice.
 */
export async function sendMessage(
  conversationId: string,
  body: string,
  imagePath?: string
): Promise<{ id: string; createdAt: Date }> {
  const { data, error } = await supabase.rpc('send_message', {
    p_conversation_id: conversationId,
    p_body: body,
    p_image_path: imagePath,
  });
  if (error) {
    console.error('Error sending message:', error);
    throw new Error(error.message.includes('not_allies') ? 'not_allies' : 'send_failed');
  }
  const result = data as unknown as { id: string; created_at: string };
  return { id: result.id, createdAt: new Date(result.created_at) };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('mark_conversation_read', {
      p_conversation_id: conversationId,
    });
    if (error) throw error;
  } catch (error) {
    // Best-effort: no leer jamás bloquea la conversación
    console.warn('Error marking conversation read:', error);
  }
}

/**
 * Suscripción en vivo a los INSERTs de una conversación. Un canal por
 * pantalla montada; devolver la función de limpieza para el unmount.
 * Los huecos (socket caído, app en background) los cubre el delta-refetch
 * del slice al volver a primer plano.
 */
export function subscribeToConversation(
  conversationId: string,
  onInsert: (message: AllyMessage) => void
): () => void {
  const channel = supabase
    .channel(`conv-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onInsert(mapMessageRow(payload.new, conversationId));
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
