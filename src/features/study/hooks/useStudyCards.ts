import { useEffect, useMemo, useState } from "react";

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { getNextStudyAvailabilityAt } from "@/entities/study-progress";
import { filterCardsForDeck } from "../model/cardSelection";
import { createStudyCard } from "../model/studyCard";
import type { Preferences } from "@/entities/preferences";

const MAX_TIMEOUT_MS = 2_147_483_647;

export const useStudyCards = (deck: Deck | undefined, cards: Card[], preferences: Preferences): Card[] => {
  const [scheduleClock, setScheduleClock] = useState(() => Date.now());
  const studyCards = useMemo(() => cards.map(createStudyCard), [cards]);

  useEffect(() => {
    const current = Date.now();
    const refresh = window.setTimeout(() => setScheduleClock(current), 0);
    return () => window.clearTimeout(refresh);
  }, [cards]);

  useEffect(() => {
    const current = Date.now();
    const next = getNextStudyAvailabilityAt(
      studyCards.map((card) => card.progress),
      current
    );
    const availability =
      next === undefined
        ? undefined
        : window.setTimeout(() => setScheduleClock(Date.now()), Math.min(next - current, MAX_TIMEOUT_MS));
    return () => {
      if (availability !== undefined) window.clearTimeout(availability);
    };
  }, [scheduleClock, studyCards]);

  return deck == null
    ? []
    : filterCardsForDeck(studyCards, deck, preferences.study, scheduleClock).map(({ card }) => card);
};
