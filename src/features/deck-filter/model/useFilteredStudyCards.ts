import { useEffect, useMemo, useState } from "react";

import type { Card } from "@/entities/card";
import { createSelectableStudyCard, type Deck, filterCardsForDeck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";
import { getNextStudyAvailabilityAt } from "@/entities/study-progress";

// Browsers clamp longer delays; capped timers reschedule until the actual availability time is reached.
const MAX_TIMEOUT_MS = 2_147_483_647;

export const useFilteredStudyCards = (deck: Deck | undefined, cards: Card[], preferences: Preferences): Card[] => {
  const [scheduleClock, setScheduleClock] = useState(() => Date.now());
  const studyCards = useMemo(() => cards.map(createSelectableStudyCard), [cards]);

  useEffect(() => {
    // Using the rendered clock makes an overdue review in a changed card list trigger an immediate refresh.
    const next = getNextStudyAvailabilityAt(
      studyCards.map((card) => card.progress),
      scheduleClock
    );
    if (next === undefined) return;

    const delay = Math.min(Math.max(next - Date.now(), 0), MAX_TIMEOUT_MS);
    const availability = window.setTimeout(() => setScheduleClock(Date.now()), delay);
    return () => window.clearTimeout(availability);
  }, [scheduleClock, studyCards]);

  return deck == null
    ? []
    : filterCardsForDeck(studyCards, deck, preferences.study, scheduleClock).map(({ card }) => card);
};
