import { StateCreator } from 'zustand';
import { Message } from '@/types';

export interface ChatSlice {
  messages: Message[];
  isLoading: boolean;

  // Actions
  addMessage: (content: string, role: 'user' | 'assistant') => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const createChatSlice: StateCreator<ChatSlice> = (set) => ({
  messages: [],
  isLoading: false,

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

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  clearMessages: () => {
    set({ messages: [] });
  },
});
