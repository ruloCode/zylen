/**
 * Timestamp-derived countdown engine for the focus session.
 *
 * A 500 ms interval only recomputes from Date.now(); nothing accumulates,
 * so background throttling self-corrects on the next tick and an AppState
 * foreground transition forces an immediate recompute (web:
 * visibilitychange). Terminal conditions (time up / pause budget overrun)
 * fire callbacks exactly once.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { FOCUS_CONFIG } from '@/constants/config';
import type { ActiveFocusSession } from '@/types/focus';
import {
  elapsedMs,
  pausedTotalMs,
  remainingMs,
} from '../utils/focusStorage';

export interface FocusTimerState {
  remainingMs: number;
  elapsedFraction: number;
  isPaused: boolean;
  /** ms of pause budget left (0 when running) */
  pauseBudgetLeftMs: number;
}

interface UseFocusTimerOptions {
  session: ActiveFocusSession | null;
  onComplete: () => void;
  onPauseBudgetExceeded: () => void;
  /** Persist pause transitions (slice action) */
  onPauseChange: (pausedAccumMs: number, pauseStartedAt: number | null) => void;
}

function compute(session: ActiveFocusSession, now: number): FocusTimerState {
  const remaining = Math.max(0, remainingMs(session, now));
  return {
    remainingMs: remaining,
    elapsedFraction: Math.min(
      1,
      Math.max(0, elapsedMs(session, now) / session.durationMs)
    ),
    isPaused: session.pauseStartedAt !== null,
    pauseBudgetLeftMs: Math.max(
      0,
      FOCUS_CONFIG.maxPauseMs - pausedTotalMs(session, now)
    ),
  };
}

export function useFocusTimer({
  session,
  onComplete,
  onPauseBudgetExceeded,
  onPauseChange,
}: UseFocusTimerOptions): FocusTimerState & {
  pause: () => void;
  resume: () => void;
} {
  const [state, setState] = useState<FocusTimerState>(() =>
    session
      ? compute(session, Date.now())
      : { remainingMs: 0, elapsedFraction: 0, isPaused: false, pauseBudgetLeftMs: 0 }
  );
  const settledRef = useRef(false);

  // Latest callbacks without re-subscribing the interval
  const onCompleteRef = useRef(onComplete);
  const onBudgetRef = useRef(onPauseBudgetExceeded);
  onCompleteRef.current = onComplete;
  onBudgetRef.current = onPauseBudgetExceeded;

  useEffect(() => {
    settledRef.current = false;
    if (!session) return;

    const tick = () => {
      if (settledRef.current) return;
      const now = Date.now();
      const next = compute(session, now);
      setState(next);

      if (pausedTotalMs(session, now) > FOCUS_CONFIG.maxPauseMs) {
        settledRef.current = true;
        onBudgetRef.current();
        return;
      }
      if (!next.isPaused && next.remainingMs <= 0) {
        settledRef.current = true;
        onCompleteRef.current();
      }
    };

    tick();
    const interval = setInterval(tick, 500);
    // Recompute immediately when the app returns to the foreground.
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') tick();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [session]);

  const pause = useCallback(() => {
    if (!session || session.pauseStartedAt !== null) return;
    onPauseChange(session.pausedAccumMs, Date.now());
  }, [session, onPauseChange]);

  const resume = useCallback(() => {
    if (!session || session.pauseStartedAt === null) return;
    const pausedAccum =
      session.pausedAccumMs + (Date.now() - session.pauseStartedAt);
    onPauseChange(pausedAccum, null);
  }, [session, onPauseChange]);

  return { ...state, pause, resume };
}

/** MM:SS (or H:MM:SS) — same shape MeasureLogger uses. */
export function formatCountdown(ms: number): string {
  const secs = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
