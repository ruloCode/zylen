import type { Message } from '@/types';

/**
 * Hermes Service
 *
 * HTTP client for the Hermes Agent API server — a local AI agent running on the
 * user's machine with persistent memory, skills and system access.
 *
 * Hermes exposes an OpenAI-compatible Chat Completions API, so we send the
 * standard `{ messages, stream }` payload and parse OpenAI-style SSE. Session
 * memory is kept server-side and keyed off the `X-Hermes-Session-Id` header,
 * which we persist per browser. The `streamChatCompletion` signature mirrors
 * the OpenAI service so both backends stay interchangeable.
 *
 * In production the app is served from Vercel and reaches the local Hermes
 * machine through an HTTPS tunnel, so VITE_HERMES_API_URL points at the tunnel
 * base (…/v1). Locally it defaults to http://localhost:8642/v1. These VITE_*
 * vars are inlined at build time, so changing them requires a fresh deploy.
 *
 * Gateway contract:
 *   POST {VITE_HERMES_API_URL}/chat/completions
 *     headers: Authorization: Bearer {VITE_HERMES_API_KEY}
 *              X-Hermes-Session-Id: {session_id}
 *     body:    { messages: [{ role, content }], stream: true }
 *     returns: OpenAI-style SSE — `data: {json}\n\n`, terminated by `data: [DONE]`
 */

const HERMES_API_URL = (import.meta.env.VITE_HERMES_API_URL || 'http://localhost:8642/v1').replace(/\/$/, '');

const HERMES_API_KEY = import.meta.env.VITE_HERMES_API_KEY || '';

const SESSION_STORAGE_KEY = 'everlight_hermes_session_id';

/**
 * Error thrown when the Hermes API responds with a non-OK status. Carries a
 * stable `code` so the UI can map it to a translated message instead of
 * rendering raw technical (English) detail.
 */
export class HermesApiError extends Error {
  readonly code = 'HERMES_UNAVAILABLE';

  constructor(readonly status: number) {
    super(`HERMES_UNAVAILABLE (${status})`);
    this.name = 'HermesApiError';
  }
}

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

/** Converts app messages into the OpenAI Chat Completions message format. */
function toChatMessages(messages: Message[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map((msg) => ({ role: msg.role, content: msg.content }));
}

/**
 * Streams a chat response from the Hermes OpenAI-compatible API.
 *
 * @param messages - Conversation history (latest message last). Sent in full;
 *                   Hermes also keeps its own memory via the session header.
 * @param onChunk  - Called with each text delta as it arrives.
 */
export async function streamChatCompletion(
  messages: Message[],
  onChunk: (delta: string) => void
): Promise<void> {
  const response = await fetch(`${HERMES_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(HERMES_API_KEY ? { Authorization: `Bearer ${HERMES_API_KEY}` } : {}),
      'X-Hermes-Session-Id': getSessionId(),
    },
    body: JSON.stringify({
      messages: toChatMessages(messages),
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    console.error(
      `Hermes API error (${response.status}). Make sure the Hermes API server is running at ${HERMES_API_URL}.`
    );
    throw new HermesApiError(response.status);
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

    try {
      const parsed = JSON.parse(data);
      const delta = parsed?.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta) onChunk(delta);
    } catch {
      // Ignore non-JSON keep-alive lines / comments.
    }
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
 * two are interchangeable.
 */
export const HermesService = {
  streamChatCompletion,
  // Requires an API key to talk to the Hermes API server.
  isConfigured: () => !!HERMES_API_KEY,
  getSessionId,
  resetSession,
};
