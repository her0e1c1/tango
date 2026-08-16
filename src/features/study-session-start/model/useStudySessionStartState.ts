import { useCardsByDeckId } from "@/entities/card";
import { filterCardsForDeck, useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { startStudy } from "@/entities/study-session";

export const useStudySessionStartState = (deckId: string) => {
  const deck = useDeck(deckId);
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deckId);
  const cards = deck == null ? [] : filterCardsForDeck(deckCards, deck, preferences.study);

  return {
    available: deck != null,
    deckName: deck?.name ?? "",
    maxNumberOfCardsToLearn: preferences.study.maxNumberOfCardsToLearn,
    cardsLength: cards.length,
    tags,
    onStart: () => {
      if (deck == null) return;
      startStudy(deck.id, cards, preferences.study);
    },
  };
};
