import { useDecks, isDeckTagSelectionMatching } from "@/entities/deck";
import { useCardsByDeckId, classifyFsrsState } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { DeckFilterValues } from "@/features/deck-filter";
import { usePreferences } from "@/entities/preference";
import { useDeadlineQuery } from "@/shared/lib/useDeadlineQuery";
import { selectStudyCardsWithDeadline } from "@/entities/study-session";

export const useStudySessionStartState = (deckId: DeckId, filter: DeckFilterValues) => {
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deckId, useDecks());

  const { cards } = useDeadlineQuery(selectStudyCardsWithDeadline, [
    deckCards,
    filter,
    { useCardInterval: preferences.study.useCardInterval, classifyFsrsState, isDeckTagSelectionMatching },
  ]);

  return {
    maxNumberOfCardsToLearn: preferences.study.maxNumberOfCardsToLearn,
    cardsLength: cards.length,
    tags,
    cards,
    studyPreferences: preferences.study,
  };
};
