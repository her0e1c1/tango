import { dismissSaveError } from "./dismissSaveError";
import type { RefObject } from "react";
import { createCard, type CardId } from "@/entities/card";
import type { CardCreateFormValues } from "../useCardCreateFormState";
import { showToast, type ToastId } from "@/shared/ui/toast";

export async function submitCardCreation(
  values: CardCreateFormValues,
  {
    uid,
    saveErrorToastId,
    isMounted,
    onCreated,
    cardId,
    deckId,
  }: {
    uid: string;
    saveErrorToastId: RefObject<ToastId | undefined>;
    isMounted: () => boolean;
    onCreated: (id: CardId) => void;
    cardId: CardId;
    deckId: string;
  }
): Promise<void> {
  dismissSaveError(saveErrorToastId);
  try {
    await createCard(uid, { id: cardId, uniqueKey: cardId, deckId, ...values });
    // Stale persistence completion must not navigate a route that has already unmounted.
    if (isMounted()) {
      showToast({ message: `Created card “${values.frontText}”.`, tone: "success" });
      onCreated(cardId);
    }
  } catch {
    if (isMounted())
      saveErrorToastId.current = showToast({ message: "Unable to create this card. Try again.", tone: "error" });
  }
}
