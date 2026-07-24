/**
 * Messages Slice — chat 1:1 entre aliados.
 *
 * Distinto del chatSlice (Coach AI, efímero): aquí todo persiste en Supabase
 * y la entrega en vivo llega por Realtime (suscripción de la pantalla) +
 * push. Los mensajes se guardan ASCENDENTES (viejo → nuevo) por conversación.
 *
 * Envío optimista: el mensaje entra como `pending` con id temporal, el RPC
 * devuelve { id, createdAt } y se reconcilia; si Realtime entrega el propio
 * INSERT antes/después, el dedup por id lo absorbe.
 */

import type { StateCreator } from 'zustand';
import type { AllyMessage, Conversation } from '@/types/allyChat';
import * as ChatService from '@/services/supabase/chat.service';
import * as PostsService from '@/services/supabase/posts.service';
import type { AppStore } from './types';

const PAGE_SIZE = 50;

export interface MessagesSlice {
  conversations: Conversation[];
  conversationsLoading: boolean;
  unreadTotal: number;
  /** conversationId → mensajes ascendentes (viejo → nuevo) */
  messagesByConversation: Record<string, AllyMessage[]>;
  messagesLoading: boolean;

  loadConversations: () => Promise<void>;
  /** Abre (o crea) el DM con un aliado; devuelve el conversationId. */
  openDm: (friendId: string) => Promise<string>;
  loadMessages: (conversationId: string) => Promise<void>;
  /** Delta-refetch (foreground/reconexión): merge por id de la última página. */
  refreshConversation: (conversationId: string) => Promise<void>;
  sendAllyMessage: (
    conversationId: string,
    body: string,
    photoUri?: string
  ) => Promise<void>;
  /** Entrada de Realtime — dedup por id. */
  receiveRealtimeMessage: (message: AllyMessage) => void;
  markConversationRead: (conversationId: string) => Promise<void>;
}

function sortAsc(messages: AllyMessage[]): AllyMessage[] {
  return [...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

function mergeById(existing: AllyMessage[], incoming: AllyMessage[]): AllyMessage[] {
  const byId = new Map(existing.map((m) => [m.id, m]));
  for (const message of incoming) byId.set(message.id, message);
  return sortAsc([...byId.values()]);
}

export const createMessagesSlice: StateCreator<AppStore, [], [], MessagesSlice> = (
  set,
  get
) => ({
  conversations: [],
  conversationsLoading: false,
  unreadTotal: 0,
  messagesByConversation: {},
  messagesLoading: false,

  loadConversations: async () => {
    set({ conversationsLoading: true });
    try {
      const conversations = await ChatService.getConversations();
      set({
        conversations,
        unreadTotal: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
        conversationsLoading: false,
      });
    } catch (error) {
      console.error('Error loading conversations:', error);
      set({ conversationsLoading: false });
    }
  },

  openDm: async (friendId: string) => {
    const conversationId = await ChatService.getOrCreateDm(friendId);
    // La lista se refresca en segundo plano para que aparezca la nueva
    void get().loadConversations();
    return conversationId;
  },

  loadMessages: async (conversationId: string) => {
    set({ messagesLoading: true });
    try {
      const page = await ChatService.getMessages(conversationId, PAGE_SIZE);
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: mergeById(
            // conserva pendientes en vuelo si los hubiera
            (state.messagesByConversation[conversationId] ?? []).filter(
              (m) => m.status !== 'sent'
            ),
            page
          ),
        },
        messagesLoading: false,
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      set({ messagesLoading: false });
    }
  },

  refreshConversation: async (conversationId: string) => {
    try {
      const page = await ChatService.getMessages(conversationId, PAGE_SIZE);
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: mergeById(
            state.messagesByConversation[conversationId] ?? [],
            page
          ),
        },
      }));
    } catch (error) {
      console.warn('Error refreshing conversation:', error);
    }
  },

  sendAllyMessage: async (conversationId, body, photoUri) => {
    const user = get().user;
    if (!user) return;
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: AllyMessage = {
      id: tempId,
      conversationId,
      senderId: user.id,
      kind: photoUri ? 'image' : 'text',
      body: body.trim(),
      createdAt: new Date(),
      status: 'pending',
    };
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [
          ...(state.messagesByConversation[conversationId] ?? []),
          optimistic,
        ],
      },
    }));

    const patchTemp = (patch: Partial<AllyMessage>) =>
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: (state.messagesByConversation[conversationId] ?? []).map(
            (m) => (m.id === tempId ? { ...m, ...patch } : m)
          ),
        },
      }));

    try {
      // La foto se sube ANTES del RPC: send_message valida el path
      const imagePath = photoUri
        ? await PostsService.uploadChatPhoto(conversationId, photoUri)
        : undefined;
      if (imagePath) patchTemp({ imagePath });

      const { id, createdAt } = await ChatService.sendMessage(
        conversationId,
        optimistic.body,
        imagePath
      );
      // Reconciliar: puede que Realtime ya haya entregado el INSERT propio
      set((state) => {
        const list = state.messagesByConversation[conversationId] ?? [];
        const alreadyDelivered = list.some((m) => m.id === id);
        const next = alreadyDelivered
          ? list.filter((m) => m.id !== tempId)
          : list.map((m) =>
              m.id === tempId
                ? { ...m, id, createdAt, imagePath: imagePath ?? m.imagePath, status: 'sent' as const }
                : m
            );
        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: sortAsc(next),
          },
        };
      });
      void get().loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      patchTemp({ status: 'failed' });
      throw error;
    }
  },

  receiveRealtimeMessage: (message) => {
    set((state) => {
      const list = state.messagesByConversation[message.conversationId] ?? [];
      if (list.some((m) => m.id === message.id)) return state;
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [message.conversationId]: sortAsc([...list, message]),
        },
      };
    });
  },

  markConversationRead: async (conversationId: string) => {
    set((state) => {
      const conversations = state.conversations.map((c) =>
        c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
      );
      return {
        conversations,
        unreadTotal: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
      };
    });
    await ChatService.markConversationRead(conversationId);
  },
});
