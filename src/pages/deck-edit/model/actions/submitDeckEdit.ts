import { getAuthUid } from "@/entities/auth";
import { type Deck, editDeck } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { showToast } from "@/shared/ui/toast";

import { deckEditPageStore as store } from "../store";

interface SubmitDeckEditInput {
  isMounted: () => boolean;
  deckId: Deck["id"];
  values: DeckFormFields;
}

export async function submitDeckEdit({ isMounted, deckId, values }: SubmitDeckEditInput): Promise<boolean> {
  // Validation can finish after the originating form was replaced.
  if (!isMounted()) return false;
  const pending = store.getState().submission;
  if (pending !== undefined) {
    // Keep concurrent submissions pending, but let only the original caller navigate.
    await pending;
    return false;
  }

  const input = { ...values, id: deckId, url: values.url ?? null };
  const submission = editDeck(getAuthUid(), input)
    .then(() => {
      // Shared Toast lifetime covers persistence that finishes after the editor unmounts.
      showToast({ messageKey: "deckForm.toast.updated", messageParams: { name: input.name }, tone: "success" });
      return true;
    })
    .catch(() => {
      showToast({ messageKey: "toast.saveFailure", tone: "error" });
      return false;
    });
  store.setState({ submission });

  try {
    const saved = await submission;
    return saved && store.getState().submission === submission;
  } finally {
    // An earlier visit must never release the current editor's save.
    if (store.getState().submission === submission) store.setState({ submission: undefined });
  }
}
