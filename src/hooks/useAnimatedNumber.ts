import { useEffect, useRef, useState } from 'react';

/**
 * Smoothly animates a number toward its new value (ease-out, rAF-based).
 * Used for XP/points counters so changes feel earned instead of jumping.
 * Respects prefers-reduced-motion by snapping immediately.
 */
export function useAnimatedNumber(value: number, durationMs = 600): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    const from = fromRef.current;
    if (from === value) return;

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(from + (value - from) * eased);
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, durationMs]);

  return display;
}

export default useAnimatedNumber;
