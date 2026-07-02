/**
 * Persistence for the running focus session. Everything is wall-clock
 * anchored so a reload or a throttled background tab never loses time; the
 * server re-validates the same windows inside complete_focus_session, so a
 * tampered record cannot out-earn the RPC.
 */

import { FOCUS_CONFIG } from '@/constants/config';
import type { ActiveFocusSession } from '@/types/focus';

export type PersistedSessionVerdict =
  | 'running'
  | 'complete-pending'
  | 'broken-pause'
  | 'broken-expired';

export function persistFocusSession(session: ActiveFocusSession): void {
  try {
    localStorage.setItem(FOCUS_CONFIG.storageKey, JSON.stringify(session));
  } catch (error) {
    console.warn('Failed to persist focus session:', error);
  }
}

export function readPersistedFocusSession(): ActiveFocusSession | null {
  try {
    const raw = localStorage.getItem(FOCUS_CONFIG.storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveFocusSession;
    if (
      typeof parsed?.sessionId !== 'string' ||
      typeof parsed?.durationMs !== 'number' ||
      typeof parsed?.startedAt !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPersistedFocusSession(): void {
  try {
    localStorage.removeItem(FOCUS_CONFIG.storageKey);
  } catch {
    /* noop */
  }
}

export function elapsedMs(session: ActiveFocusSession, now: number): number {
  const pausedLive = session.pauseStartedAt ? now - session.pauseStartedAt : 0;
  return now - session.startedAt - session.pausedAccumMs - pausedLive;
}

export function remainingMs(session: ActiveFocusSession, now: number): number {
  return session.durationMs - elapsedMs(session, now);
}

export function pausedTotalMs(
  session: ActiveFocusSession,
  now: number
): number {
  const pausedLive = session.pauseStartedAt ? now - session.pauseStartedAt : 0;
  return session.pausedAccumMs + pausedLive;
}

/**
 * Classify a persisted session on mount/return:
 *  - running:          still counting down, pause budget intact
 *  - complete-pending: ended while away, but within the return grace
 *  - broken-pause:     the pause budget overran
 *  - broken-expired:   the timer ended too long ago
 */
export function evaluatePersisted(
  session: ActiveFocusSession,
  now: number
): PersistedSessionVerdict {
  if (pausedTotalMs(session, now) > FOCUS_CONFIG.maxPauseMs) {
    return 'broken-pause';
  }
  const remaining = remainingMs(session, now);
  if (remaining > 0) return 'running';
  if (-remaining <= FOCUS_CONFIG.returnGraceMs) return 'complete-pending';
  return 'broken-expired';
}
