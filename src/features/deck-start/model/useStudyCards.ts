import { useEffect, useMemo, useState } from "react";

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";
import { createStudyProgress, getNextStudyAvailabilityAt, useStudyProgresses } from "@/entities/study-progress";
import { filterCardsForDeck, type SelectableStudyCard } from "./cardSelection";

// Browsers clamp longer delays; capped timers reschedule until the actual availability time is reached.
const MAX_TIMEOUT_MS = 2_147_483_647;

const useStudyCardItems = (cards: Card[]): SelectableStudyCard[] => {
  const progresses = useStudyProgresses();
  const progressesByCardId = useMemo(
    () => new Map(progresses.map((progress) => [progress.cardId, progress])),
    [progresses]
  );
  return useMemo(
    () => cards.map((card) => ({ card, progress: progressesByCardId.get(card.id) ?? createStudyProgress(card.id) })),
    [cards, progressesByCardId]
  );
};

export const useStudyCards = (
  deck: Deck | undefined,
  cards: Card[],
  preferences: Preferences
): SelectableStudyCard[] => {
  const [scheduleClock, setScheduleClock] = useState(() => Date.now());
  const studyCards = useStudyCardItems(cards);

  useEffect(() => {
    // Refresh after rendering so a changed card list is filtered against current time, not the previous clock.
    const current = Date.now();
    const refresh = window.setTimeout(() => setScheduleClock(current), 0);
    return () => window.clearTimeout(refresh);
  }, [studyCards]);

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

  return deck == null ? [] : filterCardsForDeck(studyCards, deck, preferences.study, scheduleClock);
};
