import { deleteCard } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";
import { cardListStore } from "../store";

export async function confirmCardDeletion(uid: string): Promise<void> {
  const { deletionTarget: card, mutationPending, owner } = cardListStore.getState();
  if (card == null || mutationPending || owner === undefined) return;
  cardListStore.setState({ mutationPending: true });
  try {
    await deleteCard(uid, card);
    if (cardListStore.getState().owner !== owner) return;
    cardListStore.setState({ deletionTarget: undefined });
    showToast({ messageKey: "cardList.toast.deleted", messageParams: { name: card.frontText }, tone: "success" });
  } catch {
    if (cardListStore.getState().owner === owner) {
      // Retry starts from a newly selected Card after a failed deletion.
      cardListStore.setState({ deletionTarget: undefined });
      showToast({
        messageKey: "cardList.toast.deleteFailure",
        tone: "error",
      });
    }
  } finally {
    // A previous visit must never release the current visit's mutation lock.
    if (cardListStore.getState().owner === owner) cardListStore.setState({ mutationPending: false });
  }
}
