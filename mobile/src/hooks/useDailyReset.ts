import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/** YYYY-MM-DD for a date in the **device's local** timezone. */
function localDayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Fires `onNewDay` exactly when the device's local calendar day rolls over
 * (00:00 local time), so daily state (habit completions, streak strip) can be
 * refreshed without waiting for a manual reload.
 *
 * It covers two cases:
 *  - The app stays open across midnight → a timer scheduled to the next local
 *    midnight fires and re-arms itself for the following day.
 *  - The app was backgrounded/asleep across midnight → when it returns to the
 *    `active` AppState we compare the current local day to the last one we
 *    saw and fire if it changed.
 *
 * The callback is read from a ref so consumers can pass an inline closure
 * without re-arming the timer on every render.
 */
export function useDailyReset(onNewDay: () => void): void {
  const callbackRef = useRef(onNewDay);
  callbackRef.current = onNewDay;

  const lastDayRef = useRef<string>(localDayKey());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const fireIfNewDay = () => {
      const today = localDayKey();
      if (today !== lastDayRef.current) {
        lastDayRef.current = today;
        callbackRef.current();
      }
    };

    const scheduleNextMidnight = () => {
      const now = new Date();
      // +1s past midnight guarantees the local date has actually rolled over.
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1,
        0
      );
      timer = setTimeout(() => {
        fireIfNewDay();
        scheduleNextMidnight();
      }, nextMidnight.getTime() - now.getTime());
    };

    scheduleNextMidnight();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') fireIfNewDay();
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);
}
