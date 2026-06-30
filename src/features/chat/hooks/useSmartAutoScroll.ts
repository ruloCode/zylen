import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

/** Distance (px) from the bottom within which we consider the user "pinned". */
const PIN_THRESHOLD = 80;

interface SmartAutoScroll {
  /** Ref for the scrollable messages container. */
  scrollRef: React.RefObject<HTMLDivElement>;
  /** Ref for the sentinel element at the very bottom of the list. */
  endRef: React.RefObject<HTMLDivElement>;
  /** Attach to the container's onScroll. */
  onScroll: () => void;
  /** True when the user has scrolled up and new content arrived below. */
  showJump: boolean;
  /** Smoothly scrolls to the bottom and re-pins. */
  scrollToBottom: () => void;
}

/**
 * Smart auto-scroll for chat surfaces.
 *
 * While the user is "pinned" near the bottom, new content (passed via `deps`)
 * keeps the latest message in view. The moment they scroll up to read, we stop
 * yanking them back down and instead surface a "new messages" jump button so
 * they stay in control. Tapping it (or scrolling back to the bottom) re-pins.
 */
export function useSmartAutoScroll(deps: DependencyList): SmartAutoScroll {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < PIN_THRESHOLD;
    pinnedRef.current = nearBottom;
    if (nearBottom) setShowJump(false);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    endRef.current?.scrollIntoView({ behavior });
    pinnedRef.current = true;
    setShowJump(false);
  }, []);

  // On new content: follow if pinned, otherwise flag unseen messages below.
  useEffect(() => {
    if (pinnedRef.current) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShowJump(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    scrollRef,
    endRef,
    onScroll,
    showJump,
    scrollToBottom: () => scrollToBottom('smooth'),
  };
}
