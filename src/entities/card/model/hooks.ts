import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { useDeck, useDecks } from "@/entities/deck/@x/card";
import { cardStore } from "./store";
import type { Card, CardId } from "./types";

export const useInvalidCardIds = (): readonly CardId[] => useStore(cardStore, (state) => state.invalidCardIds);

export const useCards = (): Card[] => {
  const cardsById = useStore(cardStore, (state) => state.cardsById);
  const decks = useDecks();
  return Object.values(cardsById)
    .filter((card) => decks.some((deck) => deck.id === card.deckId && deck.uid === card.uid))
    .sort((left, right) => left.id.localeCompare(right.id));
};

export const useCard = (id: CardId | undefined): Card | undefined => {
  const card = useStore(cardStore, (state) =>
    id !== undefined && Object.hasOwn(state.cardsById, id) ? state.cardsById[id] : undefined
  );
  const deck = useDeck(card?.deckId);
  return card && deck?.uid === card.uid ? card : undefined;
};

// Preserve Study's existing empty-cache heuristic while its Card data is scoped to one Deck.
export const useHasCards = (): boolean => {
  const decks = useDecks();
  return useStore(cardStore, (state) =>
    decks.some((deck) => state.cardIdsByDeckId.get(deck.id)?.some((id) => state.cardsById[id]?.uid === deck.uid))
  );
};

export const useCardsByDeckId = (deckId: string): { cards: Card[]; tags: string[] } => {
  const uid = useDeck(deckId)?.uid;
  const cards = useStore(
    cardStore,
    useShallow((state) =>
      (state.cardIdsByDeckId.get(deckId) ?? [])
        .map((id) => state.cardsById[id])
        .filter((card): card is Card => card !== undefined && card.uid === uid)
    )
  );
  return { cards, tags: [...new Set(cards.flatMap((card) => card.tags))].sort() };
};
