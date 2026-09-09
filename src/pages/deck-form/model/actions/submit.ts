import { getAuthUid } from "@/entities/auth";
import { editDeck } from "@/entities/deck";
import { showToast } from "@/shared/ui/toast";

import type { SubmitDeckFormInput } from "../types";

export async function submit({ deck, values }: SubmitDeckFormInput): Promise<boolean> {
  // Capture the submitted values so persistence and feedback cannot observe a later draft.
  const input = {
    ...values,
    id: deck.id,
    localMode: values.localMode ?? deck.localMode,
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
