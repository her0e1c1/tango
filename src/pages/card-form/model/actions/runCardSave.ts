import type { RefObject } from "react";

import type { CardId } from "@/entities/card";
import { showToast, type ToastId } from "@/shared/ui/toast";

import type { CardFormValues } from "../cardFormSchema";
import { dismissSaveError } from "./dismissSaveError";
import { saveCard } from "./saveCard";

export async function runCardSave(
  values: CardFormValues,
  {
    cardId,
    savingRef,
    setIsSaving,
    saveErrorToastId,
    isMounted,
    onSaved,
  }: {
    cardId: CardId;
    savingRef: RefObject<boolean>;
    setIsSaving: (saving: boolean) => void;
    saveErrorToastId: RefObject<ToastId | undefined>;
    isMounted: () => boolean;
    onSaved: () => void;
  }
): Promise<void> {
  // Validation can finish for two same-tick submits before React publishes pending state.
  if (savingRef.current) return;
  const savedInput = { ...values, tags: [...values.tags] };
  savingRef.current = true;
  setIsSaving(true);
  dismissSaveError(saveErrorToastId);
  try {
    await saveCard({ id: cardId, ...savedInput });
    // The initiating route owns feedback and navigation even when persistence outlives it.
    if (isMounted()) {
      showToast({
        messageKey: "cardForm.toast.updated",
        messageParams: { name: savedInput.frontText },
        tone: "success",
      });
      onSaved();
    }
  } catch {
    if (isMounted()) saveErrorToastId.current = showToast({ messageKey: "toast.saveFailure", tone: "error" });
  } finally {
    savingRef.current = false;
    if (isMounted()) setIsSaving(false);
  }
}
