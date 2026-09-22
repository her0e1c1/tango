import { deleteCardStudyStates } from "@/entities/card-study-state";
import { getAuthUid } from "@/entities/auth";
import { getCards } from "@/entities/card";
import { deleteDeck } from "@/entities/deck";
import { showToast } from "@/shared/ui/toast";
import type { DeckDeletionTarget } from "../types";

export const confirmDeckDeletion = async ({
  target,
  pending,
  setTarget,
  setPending,
  isMounted,
  onDeleted,
}: {
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
    const uid = getAuthUid();
    const cardIds = getCards()
      .filter((card) => card.uid === uid && card.deckId === deck.id)
      .map((card) => card.id);
    await deleteDeck(uid, deck.id);
    await deleteCardStudyStates(uid, { deckId: deck.id, cardIds });
    if (!isMounted()) return;
    setTarget(undefined);
    showToast({ messageKey: "deckDeletion.toast.deleted", messageParams: { name: deck.name }, tone: "success" });
    onDeleted?.();
  } catch {
    if (isMounted()) {
      // A failed attempt ends with the dialog closed; retry starts from a newly selected Deck.
      setTarget(undefined);
      showToast({
        messageKey: "deckDeletion.toast.failure",
        tone: "error",
      });
    }
  } finally {
    if (isMounted()) setPending(false);
  }
};
