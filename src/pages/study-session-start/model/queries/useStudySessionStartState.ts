import { useStudyCards } from "@/entities/card-study-state";
import { useCardsByDeckId } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { DeckFilterValues } from "@/features/deck-filter";
import { usePreferences } from "@/entities/preference";
import { useDeadlineQuery } from "@/shared/lib/useDeadlineQuery";
import { selectStudyCardsWithDeadline } from "@/entities/study-session";

export const useStudySessionStartState = (deckId: DeckId, filter: DeckFilterValues) => {
  const preferences = usePreferences();
  const { tags } = useCardsByDeckId(deckId);
  const deckCards = useStudyCards().filter((card) => card.deckId === deckId);

  const { cards } = useDeadlineQuery(selectStudyCardsWithDeadline, [
    deckCards,
    filter,
    preferences.study.useCardInterval,
  ]);

  return {
    maxNumberOfCardsToLearn: preferences.study.maxNumberOfCardsToLearn,
    cardsLength: cards.length,
    tags,
    cards,
    studyPreferences: preferences.study,
  };
};
