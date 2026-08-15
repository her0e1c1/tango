import type { SwipeDirection } from "@/entities/preferences";

import React from "react";

const SWIPE_FEEDBACK_DURATION_MS = 900;

export const useSwipeFeedback = (enabled: boolean) => {
  const [lastSwipe, setLastSwipe] = React.useState<{ direction: SwipeDirection; eventId: number }>();
  const nextEventId = React.useRef(0);

  const showSwipe = React.useCallback(
    (direction: SwipeDirection) => {
      if (!enabled) return;
      nextEventId.current += 1;
      const eventId = nextEventId.current;
      setLastSwipe({ direction, eventId });
      return () => {
        setLastSwipe((current) => (current?.eventId === eventId ? undefined : current));
      };
    },
    [enabled]
  );

  React.useEffect(() => {
    if (lastSwipe === undefined) return;
    const timeout = globalThis.setTimeout(() => setLastSwipe(undefined), SWIPE_FEEDBACK_DURATION_MS);
    return () => globalThis.clearTimeout(timeout);
  }, [lastSwipe]);

  return { lastSwipe: enabled ? lastSwipe?.direction : undefined, showSwipe };
};
