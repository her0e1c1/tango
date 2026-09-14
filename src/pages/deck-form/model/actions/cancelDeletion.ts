import { cancelDeckDeletion } from "@/features/deck-deletion";

import { deckFormPageStore } from "../store";

export function cancelDeletion(): void {
  cancelDeckDeletion({
    pending: deckFormPageStore.getState().deletionPending,
    setTarget: (deletionTarget) => deckFormPageStore.setState({ deletionTarget }),
  });
}
