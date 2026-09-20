import { useCardsByDeckId } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { DeckFilterValues } from "@/features/deck-filter";
import { usePreferences } from "@/entities/preference";
import { selectStudyCards } from "@/entities/study-session";

export const useStudySessionStartState = (deck: Deck, filter: DeckFilterValues) => {
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deck.id);

  const cards = selectStudyCards(deckCards, { ...deck, ...filter }, preferences.study.useCardInterval);

  return {
    deckName: deck.name,
    maxNumberOfCardsToLearn: preferences.study.maxNumberOfCardsToLearn,
    cardsLength: cards.length,
    tags,
    cards,
    studyPreferences: preferences.study,
  };
};
