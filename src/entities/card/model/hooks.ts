import { useStore } from "zustand";

import type { Deck } from "@/entities/deck/@x/card";
import { filterCardsByDeckId, filterTagsByDeckId } from "./rules";
import { cardStore } from "./store";
import type { Card, CardId } from "./types";

export const useCards = (decks: readonly Pick<Deck, "id" | "uid">[]): Card[] => {
  const { remoteCards } = useStore(cardStore);
  return remoteCards.filter((card) => decks.some((deck) => deck.id === card.deckId && deck.uid === card.uid));
};

export const useCard = (id: CardId | undefined, decks: readonly Pick<Deck, "id" | "uid">[]): Card | undefined =>
  useCards(decks).find((card) => card.id === id);

export const useCardsByDeckId = (
  deckId: string,
  decks: readonly Pick<Deck, "id" | "uid">[]
): { cards: Card[]; tags: string[] } => {
  const allCards = useCards(decks);
  return {
    cards: filterCardsByDeckId(allCards, deckId),
    tags: filterTagsByDeckId(allCards, deckId),
  };
};
