import { useEffect, useState } from "react";

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";
import { filterStudyCards } from "./filterStudyCards";

// Browsers clamp longer delays; capped timers reschedule until the actual availability time is reached.
const MAX_TIMEOUT_MS = 2_147_483_647;

const getNextStudyAvailabilityAt = (cards: Card[], now: number): number | undefined => {
  let next: number | undefined;
  for (const card of cards) {
    const candidate = card.nextSeeingAt?.getTime();
    if (candidate !== undefined && candidate > now && (next === undefined || candidate < next)) {
      next = candidate;
    }
  }
  return next;
};

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

  return deck == null ? [] : filterStudyCards(cards, deck, preferences.study, now);
};
