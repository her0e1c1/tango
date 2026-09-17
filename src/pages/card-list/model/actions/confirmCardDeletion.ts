import { deleteCard } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";
import { cardListStore } from "../store";

export async function confirmCardDeletion(uid: string): Promise<void> {
  const { deletionTarget, mutationId: pendingMutationId } = cardListStore.getState();
  if (deletionTarget == null || pendingMutationId !== undefined) return;
  const mutationId = Symbol();
  cardListStore.setState({ mutationId });
  try {
    await deleteCard(uid, deletionTarget.id);
    if (cardListStore.getState().mutationId !== mutationId) return;
    showToast({
      messageKey: "cardList.toast.deleted",
      messageParams: { name: deletionTarget.frontText },
      tone: "success",
    });
  } catch {
    if (cardListStore.getState().mutationId !== mutationId) return;
    showToast({ messageKey: "cardList.toast.deleteFailure", tone: "error" });
  } finally {
    // A reset detaches pending writes; their completion must not unlock a newer mutation.
    if (cardListStore.getState().mutationId === mutationId) {
      // Both outcomes close the dialog; retry requires selecting the Card again.
      cardListStore.setState({ deletionTarget: undefined, mutationId: undefined });
    }
  }
}
