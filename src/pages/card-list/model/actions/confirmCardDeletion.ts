import { deleteCard, getCards, mustFindCardById } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";
import { cardListStore } from "../store";

export async function confirmCardDeletion(uid: string): Promise<void> {
  const { deletionTarget: cardId, mutationId: pendingMutationId } = cardListStore.getState();
  if (cardId == null || pendingMutationId !== undefined) return;
  const mutationId = Symbol();
  cardListStore.setState({ mutationId });
  try {
    // Firestore hides optimistic deletions before the write settles; keep the pending dialog and notification named.
    const { frontText } = mustFindCardById(getCards(), cardId);
    cardListStore.setState({ pendingDeletionName: frontText });
    await deleteCard(uid, cardId);
    if (cardListStore.getState().mutationId !== mutationId) return;
    showToast({ messageKey: "cardList.toast.deleted", messageParams: { name: frontText }, tone: "success" });
  } catch {
    if (cardListStore.getState().mutationId !== mutationId) return;
    showToast({ messageKey: "cardList.toast.deleteFailure", tone: "error" });
  } finally {
    // A reset detaches pending writes; their completion must not unlock a newer mutation.
    if (cardListStore.getState().mutationId === mutationId) {
      // Both outcomes close the dialog; retry requires selecting the Card again.
      cardListStore.setState({ deletionTarget: undefined, mutationId: undefined, pendingDeletionName: undefined });
    }
  }
}
