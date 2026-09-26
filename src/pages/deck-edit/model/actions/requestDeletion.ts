import type { Deck } from "@/entities/deck";
import { requestDeckDeletion } from "@/features/deck-deletion";

import { deckEditPageStore } from "../store";

export function requestDeletion(deckId: Deck["id"]): void {
  const state = deckEditPageStore.getState();
  if (state.submission !== undefined) return;
  requestDeckDeletion(deckId, {
    pending: deckEditPageStore.getState().deletionId !== undefined,
    setTarget: (deletionTarget) => deckEditPageStore.setState({ deletionTarget }),
  });
}
