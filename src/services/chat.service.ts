import type { Message } from '@/types';
import { OpenAIService } from './openai.service';
import { HermesService } from './hermes.service';

/**
 * Chat backend selector.
 *
 * Picks the active chat backend at build time based on `VITE_CHAT_BACKEND`:
 *   - `hermes` → talk to the local Hermes Agent gateway ({@link HermesService})
 *   - `openai` (default) → talk to OpenAI directly ({@link OpenAIService})
 *
 * Both backends expose the same `ChatBackend` interface, so consumers
 * (e.g. the Chat page) stay completely agnostic to which one is in use.
 */

/** Common contract shared by every chat backend. */
export interface ChatBackend {
  /**
   * Streams an assistant response, invoking `onChunk` with each text delta.
   * @param messages - Conversation history (latest message last).
   * @param onChunk  - Receives incremental text as it arrives.
   */
  streamChatCompletion: (
    messages: Message[],
    onChunk: (delta: string) => void
  ) => Promise<void>;
  /** Whether the backend is usable (e.g. API key present). */
  isConfigured: () => boolean;
}

export type ChatBackendName = 'hermes' | 'openai';

export const CHAT_BACKEND: ChatBackendName =
  import.meta.env.VITE_CHAT_BACKEND === 'hermes' ? 'hermes' : 'openai';

/** The active chat backend, resolved from `VITE_CHAT_BACKEND`. */
export const ChatService: ChatBackend =
  CHAT_BACKEND === 'hermes' ? HermesService : OpenAIService;
