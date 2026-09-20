import { getCards } from "@/entities/card";
import { type Deck, getDecks } from "@/entities/deck";
import { requestDeckDeletion } from "@/features/deck-deletion";

import { deckEditPageStore } from "../store";

export function requestDeletion(deckId: Deck["id"]): void {
  requestDeckDeletion(deckId, {
    pending: deckEditPageStore.getState().deletionPending,
    decks: getDecks(),
    cards: getCards(),
    setTarget: (deletionTarget) => deckEditPageStore.setState({ deletionTarget }),
  });
}
