import { deleteDeck } from "@/entities/deck";
import { showToast } from "@/shared/ui/toast";
import type { DeckDeletionTarget } from "../types";

export const confirmDeckDeletion = async ({
  uid,
  target,
  pending,
  setTarget,
  setPending,
  isMounted,
  onDeleted,
}: {
  uid: string;
  target: DeckDeletionTarget | undefined;
  pending: boolean;
  setTarget: (target: undefined) => void;
  setPending: (pending: boolean) => void;
  isMounted: () => boolean;
  onDeleted?: () => void;
}): Promise<void> => {
  if (target == null || pending) return;
  const { deck } = target;

  setPending(true);
  try {
    await deleteDeck(uid, deck.id);
    if (!isMounted()) return;
    setTarget(undefined);
    showToast({ message: `Deleted deck “${deck.name}”.`, tone: "success" });
    onDeleted?.();
  } catch {
    if (isMounted()) {
      // A failed attempt ends with the dialog closed; retry starts from a newly selected Deck.
      setTarget(undefined);
      showToast({
        message: "Unable to delete this deck. Check your connection and try again.",
        tone: "error",
      });
    }
  } finally {
    if (isMounted()) setPending(false);
  }
};
