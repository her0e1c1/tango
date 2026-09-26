import { useCardsByDeckId } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { DeckFilterValues } from "@/features/deck-filter";
import { usePreferences } from "@/entities/preference";
import { useDeadlineQuery } from "@/shared/lib/useDeadlineQuery";
import { selectStudyCardsWithDeadline } from "@/entities/study-session";

export const useStudySessionStartState = (deckId: DeckId, filter: DeckFilterValues) => {
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deckId);

  // Subscriptions trigger reevaluation; the query reads current state and time itself.
  const { cards } = useDeadlineQuery(
    () => selectStudyCardsWithDeadline(deckId, filter),
    [deckId, deckCards, filter, preferences.study.useCardInterval]
  );

  return {
    maxNumberOfCardsToLearn: preferences.study.maxNumberOfCardsToLearn,
    cardsLength: cards.length,
    tags,
    cards,
    studyPreferences: preferences.study,
  };
};
