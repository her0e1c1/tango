import { type Card, deleteCard } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";
import type { ListMutationControl } from "../types";
import { beginListMutation } from "./beginListMutation";
import { finishListMutation } from "./finishListMutation";

export const confirmCardDeletion = async (
  uid: string,
  card: Card | undefined,
  mutation: ListMutationControl,
  setTarget: (card: undefined) => void
): Promise<void> => {
  if (card == null || !beginListMutation(mutation)) return;
  try {
    await deleteCard(uid, card);
    if (!mutation.isMounted()) return;
    setTarget(undefined);
    showToast({ messageKey: "cardList.toast.deleted", messageParams: { name: card.frontText }, tone: "success" });
  } catch {
    if (mutation.isMounted()) {
      // Retry starts from a newly selected Card after a failed deletion.
      setTarget(undefined);
      mutation.errorToastId.current = showToast({
        messageKey: "cardList.toast.deleteFailure",
        tone: "error",
      });
    }
  } finally {
    finishListMutation(mutation);
  }
};
