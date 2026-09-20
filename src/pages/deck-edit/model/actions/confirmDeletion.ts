import { getAuthUid } from "@/entities/auth";
import { confirmDeckDeletion } from "@/features/deck-deletion";

import { deckEditPageStore } from "../store";

export function confirmDeletion(onDeleted: () => void | Promise<void>): Promise<void> {
  const { owner, deletionTarget, deletionPending } = deckEditPageStore.getState();
  if (owner === undefined) return Promise.resolve();

  return confirmDeckDeletion({
    uid: getAuthUid(),
    target: deletionTarget,
    pending: deletionPending,
    setTarget: (target) => deckEditPageStore.setState({ deletionTarget: target }),
    setPending: (pending) => deckEditPageStore.setState({ deletionPending: pending }),
    // Shared deletion checks this before publishing completion or changing the current dialog.
    isMounted: () => deckEditPageStore.getState().owner === owner,
    onDeleted: () => void onDeleted(),
  });
}
