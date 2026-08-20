import { useCardsByDeckId } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { selectStudyCards, startStudy } from "@/entities/study-session";

export const useStudySessionStartState = (deck: Deck) => {
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deck.id);

  const cards = selectStudyCards(deckCards, deck, preferences.study.useCardInterval);

  return {
    deckName: deck.name,
    maxNumberOfCardsToLearn: preferences.study.maxNumberOfCardsToLearn,
    cardsLength: cards.length,
    tags,
    onStart: () => startStudy(deck.id, cards, preferences.study),
  };
};
