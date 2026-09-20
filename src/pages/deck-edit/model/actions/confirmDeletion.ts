import { getAuthUid } from "@/entities/auth";
import { confirmDeckDeletion } from "@/features/deck-deletion";

import { deckEditPageStore } from "../store";

export function confirmDeletion(isMounted: () => boolean, onDeleted: () => void | Promise<void>): Promise<void> {
  if (!isMounted()) return Promise.resolve();
  const { deletionTarget, deletionPending } = deckEditPageStore.getState();

  return confirmDeckDeletion({
    uid: getAuthUid(),
    target: deletionTarget,
    pending: deletionPending,
    setTarget: (target) => deckEditPageStore.setState({ deletionTarget: target }),
    setPending: (pending) => deckEditPageStore.setState({ deletionPending: pending }),
    // Shared deletion checks this before publishing completion or changing the current dialog.
    isMounted,
    onDeleted: () => void onDeleted(),
  });
}
