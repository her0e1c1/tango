import { saveCard } from "./saveCard";
import { dismissSaveError } from "./dismissSaveError";
import type { RefObject } from "react";
import type { Card } from "@/entities/card";
import type { CardFormValues } from "../useCardFormState";
import { showToast, type ToastId } from "@/shared/ui/toast";

export async function runCardSave(
  values: CardFormValues,
  {
    snapshot,
    savingRef,
    setIsSaving,
    saveErrorToastId,
    isMounted,
    onSaved,
  }: {
    snapshot: Card;
    savingRef: RefObject<boolean>;
    setIsSaving: (saving: boolean) => void;
    saveErrorToastId: RefObject<ToastId | undefined>;
    isMounted: () => boolean;
    onSaved: (deckId: Card["deckId"]) => void;
  }
): Promise<void> {
  // Validation can finish for two same-tick submits before React publishes pending state.
  if (savingRef.current) return;
  const savedInput = { ...values, tags: [...values.tags] };
  savingRef.current = true;
  setIsSaving(true);
  dismissSaveError(saveErrorToastId);
  try {
    await saveCard({ id: snapshot.id, ...savedInput });
    // The initiating route owns feedback and navigation even when persistence outlives it.
    if (isMounted()) {
      showToast({ message: `Updated card “${savedInput.frontText}”.`, tone: "success" });
      onSaved(snapshot.deckId);
    }
  } catch {
    if (isMounted())
      saveErrorToastId.current = showToast({ message: "Unable to save changes. Try again.", tone: "error" });
  } finally {
    savingRef.current = false;
    if (isMounted()) setIsSaving(false);
  }
}
