import { useStore } from "zustand";

import { deckStore } from "@/entities/deck/@x/card";
import { filterCardsByDeckId, filterTagsByDeckId } from "./rules";
import { cardStore } from "./store";
import type { Card, CardId } from "./types";

// Reads remote and local Cards as one ordered collection.
export const useCards = (): Card[] => {
  const cardState = useStore(cardStore);
  const deckState = useStore(deckStore);
  const remoteDeckMigrationIds = new Map(
    deckState.remoteDecks.flatMap((deck) => (deck.migration === undefined ? [] : [[deck.id, deck.migration.id]]))
  );
  const visibleRemoteCards = cardState.remoteCards.filter(
    (card) => card.migrationId === undefined || remoteDeckMigrationIds.get(card.deckId) === card.migrationId
  );
  const remoteCardIds = new Set(visibleRemoteCards.map(({ id }) => id));
  return [...visibleRemoteCards, ...cardState.localCards.filter(({ id }) => !remoteCardIds.has(id))];
};

// Reads one Card by identifier across both persistence modes.
export const useCard = (id: CardId | undefined): Card | undefined => useCards().find((card) => card.id === id);

// Reads the Cards and available tags owned by one Deck.
export const useCardsByDeckId = (deckId: string): { cards: Card[]; tags: string[] } => {
  const allCards = useCards();
  return {
    cards: filterCardsByDeckId(allCards, deckId),
    tags: filterTagsByDeckId(allCards, deckId),
  };
};
