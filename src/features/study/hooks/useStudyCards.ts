import { useEffect, useMemo, useState } from "react";

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { createStudyProgress, getNextStudyAvailabilityAt, useStudyProgresses } from "@/entities/study-progress";
import { filterCardsForDeck } from "../model/cardSelection";
import { createStudyCard, type StudyCard } from "../model/studyCard";
import type { Preferences } from "@/entities/preferences";

const MAX_TIMEOUT_MS = 2_147_483_647;

export const useStudyCardItems = (cards: Card[]): StudyCard[] => {
  const progresses = useStudyProgresses();
  const progressesByCardId = useMemo(
    () => new Map(progresses.map((progress) => [progress.cardId, progress])),
    [progresses]
  );
  return useMemo(
    () => cards.map((card) => createStudyCard(card, progressesByCardId.get(card.id) ?? createStudyProgress(card.id))),
    [cards, progressesByCardId]
  );
};

export const useStudyCards = (deck: Deck | undefined, cards: Card[], preferences: Preferences): StudyCard[] => {
  const [scheduleClock, setScheduleClock] = useState(() => Date.now());
  const studyCards = useStudyCardItems(cards);

  useEffect(() => {
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
