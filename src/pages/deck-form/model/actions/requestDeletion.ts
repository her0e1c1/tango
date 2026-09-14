import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { requestDeckDeletion } from "@/features/deck-deletion";

import type { DeckFormPageStore } from "../store";

interface RequestDeletionInput {
  deckId: Deck["id"];
  decks: Deck[];
  cards: Card[];
  store: DeckFormPageStore;
}

export function requestDeletion({ deckId, decks, cards, store }: RequestDeletionInput): void {
  requestDeckDeletion(deckId, {
    pending: store.getState().deletionPending,
    decks,
    cards,
    setTarget: (deletionTarget) => store.setState({ deletionTarget }),
  });
}
