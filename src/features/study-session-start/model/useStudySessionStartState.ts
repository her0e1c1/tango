import { useCardsByDeckId } from "@/entities/card";
import { filterCardsForDeck, useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { startStudy } from "@/entities/study-session";
import { mustExist } from "@/shared/lib/mustExist";

export const useStudySessionStartState = (deckId: string) => {
  const deck = mustExist(useDeck(deckId), "Study start rendered outside RouteEntityBoundary");
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deckId);
  const cards = filterCardsForDeck(deckCards, deck, preferences.study);

  return {
    deckName: deck.name,
    maxNumberOfCardsToLearn: preferences.study.maxNumberOfCardsToLearn,
    cardsLength: cards.length,
    tags,
    onStart: () => startStudy(deck.id, cards, preferences.study),
  };
};
