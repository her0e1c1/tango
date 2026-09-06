import type { BaseSyntheticEvent, RefObject } from "react";
import type { UseFormHandleSubmit } from "react-hook-form";

import { createCard, type CardId } from "@/entities/card";
import { showToast, type ToastId } from "@/shared/ui/toast";

import type { CardCreateFormValues } from "../schema";
import { dismissSaveError } from "./dismissSaveError";

export async function submitCardCreation(
  event: BaseSyntheticEvent | undefined,
  {
    handleSubmit,
    uid,
    saveErrorToastId,
    isMounted,
    onCreated,
    cardId,
    deckId,
    pending,
  }: {
    handleSubmit: UseFormHandleSubmit<CardCreateFormValues>;
    uid: string;
    saveErrorToastId: RefObject<ToastId | undefined>;
    isMounted: () => boolean;
    onCreated: (id: CardId) => void;
    cardId: CardId;
    deckId: string;
    pending: RefObject<boolean>;
  }
): Promise<void> {
  // RHF supplies presentation state; this lock closes the gap before validation resolves.
  if (pending.current) {
    event?.preventDefault();
    return;
  }
  pending.current = true;
  try {
    await handleSubmit(async (values) => {
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
    })(event);
  } finally {
    pending.current = false;
  }
}
