import { useEffect, useState } from "react";

import type { Card } from "@/entities/card";
import { type Deck, filterCardsForDeck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";
import { getNextStudyAvailabilityAt } from "@/entities/study-progress";

// Browsers clamp longer delays; capped timers reschedule until the actual availability time is reached.
const MAX_TIMEOUT_MS = 2_147_483_647;

export const useFilteredStudyCards = (deck: Deck | undefined, cards: Card[], preferences: Preferences): Card[] => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Refreshing at the next due time keeps the visible selection current while the page remains open.
    const next = getNextStudyAvailabilityAt(cards, now);
    if (next === undefined) return;

    const delay = Math.min(Math.max(next - Date.now(), 0), MAX_TIMEOUT_MS);
    const availability = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(availability);
  }, [cards, now]);

  return deck == null ? [] : filterCardsForDeck(cards, deck, preferences.study, now);
};
