import { cancelDeckDeletion } from "@/features/deck-deletion";

import type { DeckFormPageStore } from "../store";

export function cancelDeletion(store: DeckFormPageStore): void {
  cancelDeckDeletion({
    pending: store.getState().deletionPending,
    setTarget: (deletionTarget) => store.setState({ deletionTarget }),
  });
}
