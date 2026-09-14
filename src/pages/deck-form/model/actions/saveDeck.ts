import { getAuthUid } from "@/entities/auth";
import { type Deck, editDeck } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { showToast } from "@/shared/ui/toast";

interface SaveDeckInput {
  deckId: Deck["id"];
  localMode: Deck["localMode"];
  values: DeckFormFields;
}

export async function saveDeck({ deckId, localMode, values }: SaveDeckInput): Promise<boolean> {
  // Capture the submitted values so persistence and feedback cannot observe a later draft.
  const input = {
    ...values,
    id: deckId,
    localMode: values.localMode ?? localMode,
    url: values.url ?? null,
  };

  try {
    // Read the current actor when the action runs rather than capturing a render-time identity.
    await editDeck(getAuthUid(), input);
  } catch {
    showToast({ messageKey: "toast.saveFailure", tone: "error" });
    return false;
  }

  // Shared Toast lifetime covers persistence that finishes after the editor unmounts.
  showToast({
    messageKey: "deckForm.toast.updated",
    messageParams: { name: input.name },
    tone: "success",
  });
  return true;
}
