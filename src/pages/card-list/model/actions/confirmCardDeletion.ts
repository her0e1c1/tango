import { deleteCard } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";
import type { CardListStore } from "../store";
import { dismissListError } from "./dismissListError";

export async function confirmCardDeletion(store: CardListStore, uid: string): Promise<void> {
  const { deletionTarget: card, mutationPending } = store.getState();
  if (card == null || mutationPending) return;
  dismissListError(store);
  store.setState({ mutationPending: true });
  try {
    await deleteCard(uid, card);
    if (!store.getState().active) return;
    store.setState({ deletionTarget: undefined });
    showToast({ messageKey: "cardList.toast.deleted", messageParams: { name: card.frontText }, tone: "success" });
  } catch {
    if (store.getState().active) {
      // Retry starts from a newly selected Card after a failed deletion.
      store.setState({
        deletionTarget: undefined,
        errorToastId: showToast({
          messageKey: "cardList.toast.deleteFailure",
          tone: "error",
        }),
      });
    }
  } finally {
    store.setState({ mutationPending: false });
  }
}
