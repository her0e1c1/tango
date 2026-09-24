import { getAuthUid } from "@/entities/auth";
import { type DeckId, editDeck, getDecks, mustFindDeckById } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { showToast } from "@/shared/ui/toast";

import { deckEditPageStore as store } from "../store";

export async function submitDeckEdit(deckId: DeckId, values: DeckFormFields): Promise<boolean> {
  if (store.getState().deletionTarget !== undefined || store.getState().deletionId !== undefined) return false;
  const pending = store.getState().submission;
  if (pending !== undefined) {
    // Keep concurrent submissions pending, but let only the original caller navigate.
    await pending;
    return false;
  }

  const uid = getAuthUid();
  const input = { ...values, id: deckId, url: values.url ?? null };
  const save = async (): Promise<void> => {
    const deck = mustFindDeckById(getDecks(), deckId);
    if (deck.uid !== uid) throw new Error("Deck owner does not match the authenticated user");
    await editDeck(uid, input);
  };
  const submission = save()
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
