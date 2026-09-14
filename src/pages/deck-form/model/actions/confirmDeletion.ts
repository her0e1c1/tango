import { getAuthUid } from "@/entities/auth";
import { confirmDeckDeletion } from "@/features/deck-deletion";

import type { DeckFormPageStore } from "../store";

interface ConfirmDeletionInput {
  store: DeckFormPageStore;
  isMounted: () => boolean;
  onDeleted: () => void | Promise<void>;
}

export function confirmDeletion({ store, isMounted, onDeleted }: ConfirmDeletionInput): Promise<void> {
  const { deletionTarget, deletionPending } = store.getState();
  return confirmDeckDeletion({
    uid: getAuthUid(),
    target: deletionTarget,
    pending: deletionPending,
    setTarget: (target) => store.setState({ deletionTarget: target }),
    setPending: (pending) => store.setState({ deletionPending: pending }),
    isMounted,
    onDeleted: () => void onDeleted(),
  });
}
