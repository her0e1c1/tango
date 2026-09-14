import { getCards } from "@/entities/card";
import { type Deck, getDecks } from "@/entities/deck";
import { requestDeckDeletion } from "@/features/deck-deletion";

import { deckFormPageStore } from "../store";

export function requestDeletion(deckId: Deck["id"]): void {
  requestDeckDeletion(deckId, {
    pending: deckFormPageStore.getState().deletionPending,
    decks: getDecks(),
    cards: getCards(),
    setTarget: (deletionTarget) => deckFormPageStore.setState({ deletionTarget }),
  });
}
