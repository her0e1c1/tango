import { generateId } from "@/shared/lib/generateId";
import { getAuthUid } from "@/entities/auth";
import { createDeck, waitForDeck, type DeckId } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { showToast } from "@/shared/ui/toast";

import { deckCreatePageStore as store } from "../store";

export async function submitDeckCreation(values: DeckFormFields, signal: AbortSignal): Promise<DeckId | undefined> {
  if (store.getState().mutationId !== undefined) return;
  // Lock synchronously so submissions cannot outrun the form's next render.
  const mutationId = Symbol();
  store.setState({ mutationId });
  const uid = getAuthUid();
  const notifyFailure = () => {
    if (getAuthUid() === uid) showToast({ messageKey: "deckForm.toast.createFailure", tone: "error" });
  };
  try {
    const deckId = generateId();
    await createDeck(uid, {
      id: deckId,
      name: values.name,
      category: values.category,
    });
    // Writes survive navigation, but resetting the store detaches their results.
    if (store.getState().mutationId !== mutationId) return;
    if (getAuthUid() !== uid) {
      store.setState({ mutationId: undefined });
      return;
    }
    if (!(await waitForDeck(uid, deckId, signal))) return;
    if (signal.aborted || getAuthUid() !== uid || store.getState().mutationId !== mutationId) return;
    store.setState({ mutationId: undefined });
    showToast({ messageKey: "deckForm.toast.created", messageParams: { name: values.name }, tone: "success" });
    return deckId;
  } catch {
    if (store.getState().mutationId === mutationId) {
      store.setState({ mutationId: undefined });
      notifyFailure();
    }
    return undefined;
  }
}
