import { useEffect, useMemo, useState } from "react";

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { getNextStudyAvailabilityAt, type StudyProgress } from "@/entities/study-progress";
import { filterCardsForDeck } from "../model/cardSelection";
import { createStudyCard } from "../model/studyCard";
import type { ConfigState } from "@/shared/config";

const MAX_TIMEOUT_MS = 2_147_483_647;

export const useStudyCards = (
  deck: Deck | undefined,
  cards: Card[],
  progressesByCardId: Readonly<Record<string, StudyProgress | undefined>>,
  config: ConfigState
): Card[] => {
  const [scheduleClock, setScheduleClock] = useState(() => Date.now());
  const studyCards = useMemo(
    () =>
      cards.flatMap((card) => {
        const progress = progressesByCardId[card.id];
        return progress == null ? [] : [createStudyCard(card, progress)];
      }),
    [cards, progressesByCardId]
  );

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

  return deck == null
    ? []
    : filterCardsForDeck(studyCards, deck, config.study, scheduleClock).map(({ card, progress }) => {
        const { cardId: _cardId, ...progressFields } = progress;
        return { ...card, ...progressFields };
      });
};
