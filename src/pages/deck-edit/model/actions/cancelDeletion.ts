import { cancelDeckDeletion } from "@/features/deck-deletion";

import { deckEditPageStore } from "../store";

export function cancelDeletion(): void {
  cancelDeckDeletion({
    pending: deckEditPageStore.getState().deletionPending,
    setTarget: (deletionTarget) => deckEditPageStore.setState({ deletionTarget }),
  });
}
