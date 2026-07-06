import { useCallback, useEffect, useRef, useState, type DependencyList, type RefObject } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

/** Distance (px) from the bottom within which we consider the user "pinned". */
const PIN_THRESHOLD = 80;

interface SmartAutoScroll {
  /** Ref for the scrollable messages container (RN ScrollView). */
  scrollRef: RefObject<ScrollView | null>;
  /** Attach to the ScrollView's onScroll (with scrollEventThrottle={16}). */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /**
   * Attach to the ScrollView's onContentSizeChange — RN's equivalent of the
   * web sentinel: keeps the latest message in view while pinned.
   */
  onContentSizeChange: () => void;
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
 *
 * RN port: the web version scrolled a bottom sentinel into view; here we use
 * `ScrollView.scrollToEnd`. Wire up `scrollRef`, `onScroll` and
 * `onContentSizeChange` on the messages ScrollView.
 */
export function useSmartAutoScroll(deps: DependencyList): SmartAutoScroll {
  const scrollRef = useRef<ScrollView | null>(null);
  const pinnedRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - contentOffset.y - layoutMeasurement.height;
      const nearBottom = distanceFromBottom < PIN_THRESHOLD;
      pinnedRef.current = nearBottom;
      if (nearBottom) setShowJump(false);
    },
    []
  );

  const scrollToBottom = useCallback((animated = true) => {
    scrollRef.current?.scrollToEnd({ animated });
    pinnedRef.current = true;
    setShowJump(false);
  }, []);

  // Content grew (message added / streamed): follow while pinned.
  const onContentSizeChange = useCallback(() => {
    if (pinnedRef.current) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, []);

  // On new content: follow if pinned, otherwise flag unseen messages below.
  useEffect(() => {
    if (pinnedRef.current) {
      scrollRef.current?.scrollToEnd({ animated: true });
    } else {
      setShowJump(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    scrollRef,
    onScroll,
    onContentSizeChange,
    showJump,
    scrollToBottom: () => scrollToBottom(true),
  };
}
