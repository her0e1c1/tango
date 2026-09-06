import { dismissSaveError } from "./dismissSaveError";
import type { BaseSyntheticEvent, RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import { createDeck, generateDeckId, type DeckId } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { showToast, type ToastId } from "@/shared/ui/toast";

export const submitDeckCreation = (
  event: BaseSyntheticEvent | undefined,
  {
    form,
    uid,
    saveErrorToastId,
    isMounted,
    onCreated,
  }: {
    form: UseFormReturn<DeckFormFields>;
    uid: string;
    saveErrorToastId: RefObject<ToastId | undefined>;
    isMounted: () => boolean;
    onCreated: (id: DeckId) => void;
  }
): void => {
  void form.handleSubmit(async (values) => {
    dismissSaveError(saveErrorToastId);
    const deckId = generateDeckId();
    try {
      const deck = {
        id: deckId,
        name: values.name,
        category: values.category,
        convertToBr: values.convertToBr,
        ...(values.url === undefined ? {} : { url: values.url }),
      };
      await createDeck(uid, values.localMode ? { ...deck, localMode: true } : { ...deck, localMode: false });
      // Stale persistence completion must not navigate a route that has already unmounted.
      if (isMounted()) {
        showToast({ message: `Created deck “${values.name}”.`, tone: "success" });
        onCreated(deckId);
      }
    } catch {
      if (isMounted()) saveErrorToastId.current = showToast({ message: "Unable to create this deck.", tone: "error" });
    }
  })(event);
};
