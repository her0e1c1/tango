import type { SwipeDirection } from "@/entities/preferences";

import * as React from "react";

const SWIPE_FEEDBACK_DURATION_MS = 900;

export const useSwipeFeedback = (enabled: boolean) => {
  const [lastSwipe, setLastSwipe] = React.useState<{ direction: SwipeDirection }>();

  const showSwipe = React.useCallback(
    (direction: SwipeDirection) => {
      if (!enabled) return;
      setLastSwipe({ direction });
    },
    [enabled]
  );

  React.useEffect(() => {
    if (lastSwipe === undefined) return;
    const timeout = window.setTimeout(() => setLastSwipe(undefined), SWIPE_FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [lastSwipe]);

  return { lastSwipe: enabled ? lastSwipe?.direction : undefined, showSwipe };
};
