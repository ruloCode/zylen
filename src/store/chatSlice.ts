import { StateCreator } from 'zustand';
import { Message } from '@/types';

export interface ChatSlice {
  messages: Message[];
  isLoading: boolean;
  streamingMessageId: string | null;

  // Actions
  addMessage: (content: string, role: 'user' | 'assistant') => void;
  updateStreamingMessage: (id: string, content: string) => void;
  startStreamingMessage: () => string;
  finishStreamingMessage: () => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const createChatSlice: StateCreator<ChatSlice> = (set) => ({
  messages: [],
  isLoading: false,
  streamingMessageId: null,

  addMessage: (content: string, role: 'user' | 'assistant') => {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          content,
          role,
          timestamp: new Date(),
        },
      ],
    }));
  },

  startStreamingMessage: () => {
    const id = crypto.randomUUID();
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id,
          content: '',
          role: 'assistant',
          timestamp: new Date(),
        },
      ],
      streamingMessageId: id,
    }));
    return id;
  },

  updateStreamingMessage: (id: string, content: string) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    }));
  },

  finishStreamingMessage: () => {
    set({ streamingMessageId: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  clearMessages: () => {
    set({ messages: [], streamingMessageId: null });
  },
});
