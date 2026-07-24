/**
 * Chat entre aliados (1:1 hoy; kind 'mission' reservado para grupos por
 * misión). Distinto del chat del Coach AI (types/chat.ts), que es efímero.
 */

export type ConversationKind = 'dm' | 'mission';

export interface Conversation {
  conversationId: string;
  kind: ConversationKind;
  otherUserId?: string;
  otherUsername?: string;
  otherAvatarUrl?: string;
  otherLastActiveAt?: Date;
  lastMessageKind?: 'text' | 'image';
  lastMessageBody?: string;
  lastMessageSenderId?: string;
  lastMessageAt?: Date;
  unreadCount: number;
}

/** pending → optimista en vuelo; failed → el RPC falló (reintentable). */
export type AllyMessageStatus = 'sent' | 'pending' | 'failed';

export interface AllyMessage {
  id: string;
  conversationId: string;
  senderId: string;
  kind: 'text' | 'image';
  body: string;
  /** Path dentro del bucket progress-photos (se firma para mostrar). */
  imagePath?: string;
  createdAt: Date;
  status: AllyMessageStatus;
}
