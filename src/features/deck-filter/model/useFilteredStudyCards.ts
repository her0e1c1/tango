import { useEffect, useState } from "react";

import type { Card } from "@/entities/card";
import { type Deck, selectStudyCardsForDeck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

// Browsers clamp longer delays; capped timers reschedule until the actual availability time is reached.
const MAX_TIMEOUT_MS = 2_147_483_647;

export const useFilteredStudyCards = (deck: Deck | undefined, cards: Card[], preferences: Preferences): Card[] => {
  const [now, setNow] = useState(() => Date.now());
  const selection = selectStudyCardsForDeck(cards, deck, preferences.study, now);

  useEffect(() => {
    // Refreshing at the next due time keeps the visible selection current while the page remains open.
    if (selection.nextAvailabilityAt === undefined) return;

    const delay = Math.min(Math.max(selection.nextAvailabilityAt - Date.now(), 0), MAX_TIMEOUT_MS);
    const availability = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(availability);
  }, [now, selection.nextAvailabilityAt]);

  return selection.cards;
};
