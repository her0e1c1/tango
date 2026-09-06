import { dismissSaveError } from "./dismissSaveError";
import type { RefObject } from "react";
import { editDeck, type Deck } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { showToast, type ToastId } from "@/shared/ui/toast";

export const saveDeck = async (
  values: DeckFormFields,
  {
    uid,
    snapshot,
    savingRef,
    setIsSaving,
    saveErrorToastId,
    isMounted,
    onSaved,
  }: {
    uid: string;
    snapshot: Deck;
    savingRef: RefObject<boolean>;
    setIsSaving: (saving: boolean) => void;
    saveErrorToastId: RefObject<ToastId | undefined>;
    isMounted: () => boolean;
    onSaved: () => void;
  }
): Promise<void> => {
  // Validation can finish for two same-tick submits before React publishes pending state.
  if (savingRef.current) return;
  const savedInput = { ...values };
  savingRef.current = true;
  setIsSaving(true);
  dismissSaveError(saveErrorToastId);
  try {
    await editDeck(uid, {
      id: snapshot.id,
      ...savedInput,
      localMode: savedInput.localMode ?? snapshot.localMode,
      url: savedInput.url ?? null,
    });
    // The initiating route owns feedback and navigation even when persistence outlives it.
    if (isMounted()) {
      showToast({ message: `Updated deck “${savedInput.name}”.`, tone: "success" });
      onSaved();
    }
  } catch {
    if (isMounted())
      saveErrorToastId.current = showToast({ message: "Unable to save changes. Try again.", tone: "error" });
  } finally {
    savingRef.current = false;
    if (isMounted()) setIsSaving(false);
  }
};
