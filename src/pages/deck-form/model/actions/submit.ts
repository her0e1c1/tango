import { getAuthUid } from "@/entities/auth";
import { editDeck, type DeckId } from "@/entities/deck";
import { showToast } from "@/shared/ui/toast";

import type { DeckFormFields } from "@/features/deck-form";

export async function submit(deckId: DeckId, values: DeckFormFields): Promise<boolean> {
  // Capture the submitted values so persistence and feedback cannot observe a later draft.
  const input = {
    ...values,
    id: deckId,
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
