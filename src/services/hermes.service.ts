import type { Message } from '@/types';

/**
 * Hermes Service
 *
 * HTTP client for the Hermes Agent gateway — a local AI agent running on the
 * user's machine with persistent memory, skills and system access.
 *
 * Unlike {@link OpenAIService} (which sends the full conversation on every
 * request), Hermes keeps its own per-session context. We therefore only send
 * the latest user message plus a stable `session_id`; Hermes remembers the
 * rest. The `streamChatCompletion` signature is kept identical to the OpenAI
 * service so the two backends are interchangeable behind `ChatService`.
 *
 * Expected gateway contract:
 *   POST {VITE_HERMES_API_URL}/chat
 *     body:    { message: string, session_id: string }
 *     accept:  text/event-stream
 *     returns: Server-Sent Events stream of token/text chunks
 */

const HERMES_API_URL = (import.meta.env.VITE_HERMES_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const SESSION_STORAGE_KEY = 'everlight_hermes_session_id';

/**
 * Returns a stable session id for this browser/user, creating and persisting
 * one on first use so Hermes can keep conversation memory across reloads.
 */
function getSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    // localStorage may be unavailable (private mode / SSR) — fall back to a
    // volatile id so chat still works for the current page lifetime.
    return crypto.randomUUID();
  }
}

/**
 * Clears the persisted Hermes session, starting a fresh conversation context
 * on the next message.
 */
function resetSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/**
 * Extracts a text delta from a parsed SSE `data` payload. Hermes' exact event
 * schema can vary, so we accept the most common shapes and fall back to the
 * raw value when it is already a plain string.
 */
function extractDelta(payload: unknown): string {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return '';

  const obj = payload as Record<string, any>;

  // OpenAI-compatible shape (some gateways proxy this through unchanged).
  const openAIDelta = obj.choices?.[0]?.delta?.content;
  if (typeof openAIDelta === 'string') return openAIDelta;

  // Common single-field token shapes.
  for (const key of ['delta', 'token', 'content', 'text', 'message', 'response', 'chunk']) {
    if (typeof obj[key] === 'string') return obj[key];
  }

  return '';
}

/**
 * Streams a chat response from the Hermes gateway.
 *
 * @param messages - Conversation history. Only the latest user message is sent;
 *                   Hermes maintains the rest via `session_id`.
 * @param onChunk  - Called with each text delta as it arrives.
 */
export async function streamChatCompletion(
  messages: Message[],
  onChunk: (delta: string) => void
): Promise<void> {
  // The latest user message is what we forward to Hermes.
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const message = lastUser?.content ?? '';

  const response = await fetch(`${HERMES_API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      message,
      session_id: getSessionId(),
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(
      `Hermes gateway error (${response.status}). Make sure the Hermes API server is running at ${HERMES_API_URL}.`
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleEvent = (rawEvent: string): boolean => {
    // An SSE event is one or more `field: value` lines. We only care about
    // `data:` lines; multiple data lines are concatenated with newlines.
    const dataLines = rawEvent
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).replace(/^ /, ''));

    if (dataLines.length === 0) return false;

    const data = dataLines.join('\n');
    if (data === '[DONE]') return true; // stream finished

    let delta = '';
    try {
      delta = extractDelta(JSON.parse(data));
    } catch {
      // Not JSON — treat the raw payload as a text delta.
      delta = data;
    }

    if (delta) onChunk(delta);
    return false;
  };

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line (\n\n).
    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      if (handleEvent(rawEvent)) {
        await reader.cancel();
        return;
      }
    }
  }

  // Flush any trailing event without a terminating blank line.
  if (buffer.trim()) {
    handleEvent(buffer);
  }
}

/**
 * Hermes Service object — mirrors the OpenAIService public interface so the
 * two are interchangeable behind {@link ChatService}.
 */
export const HermesService = {
  streamChatCompletion,
  // Hermes runs locally; we always consider it "configured" since there is no
  // API key to validate. Reachability is surfaced as a runtime error instead.
  isConfigured: () => true,
  getSessionId,
  resetSession,
};
