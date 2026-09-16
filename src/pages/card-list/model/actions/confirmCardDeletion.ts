import { deleteCard, getCards, mustFindCardById } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";
import { cardListStore } from "../store";

export async function confirmCardDeletion(uid: string): Promise<void> {
  const { deletionTarget: cardId, mutationId: pendingMutationId } = cardListStore.getState();
  if (cardId == null || pendingMutationId !== undefined) return;
  const mutationId = Symbol();
  cardListStore.setState({ mutationId });
  try {
    // Keep the notification name before deletion removes the Card from the Entity store.
    const { frontText } = mustFindCardById(getCards(), cardId);
    await deleteCard(uid, cardId);
    if (cardListStore.getState().mutationId !== mutationId) return;
    cardListStore.setState({ deletionTarget: undefined });
    showToast({ messageKey: "cardList.toast.deleted", messageParams: { name: frontText }, tone: "success" });
  } catch {
    if (cardListStore.getState().mutationId === mutationId) {
      // Retry requires selecting the Card again after a failed deletion.
      cardListStore.setState({ deletionTarget: undefined });
      showToast({
        messageKey: "cardList.toast.deleteFailure",
        tone: "error",
      });
    }
  } finally {
    // A reset detaches pending writes; their completion must not unlock a newer mutation.
    if (cardListStore.getState().mutationId === mutationId) {
      cardListStore.setState({ mutationId: undefined });
    }
  }
}
