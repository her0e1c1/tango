import { generateId } from "@/shared/lib/generateId";
import { getAuthUid } from "@/entities/auth";
import { createDeck, type DeckId } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { showToast } from "@/shared/ui/toast";

import { deckCreatePageStore as store } from "../store";

export async function submitDeckCreation(values: DeckFormFields): Promise<DeckId | undefined> {
  if (store.getState().mutationId !== undefined) return;
  // Lock synchronously so submissions cannot outrun the form's next render.
  const mutationId = Symbol();
  store.setState({ mutationId });
  try {
    const uid = getAuthUid();
    const deckId = generateId();
    await createDeck(uid, {
      id: deckId,
      name: values.name,
      category: values.category,
      convertToBr: values.convertToBr,

      ...(values.url === undefined ? {} : { url: values.url }),
    });
    // Writes survive navigation, but resetting the store detaches their results.
    if (store.getState().mutationId !== mutationId) return;
    showToast({ messageKey: "deckForm.toast.created", messageParams: { name: values.name }, tone: "success" });
    return deckId;
  } catch {
    if (store.getState().mutationId === mutationId) {
      showToast({ messageKey: "deckForm.toast.createFailure", tone: "error" });
    }
    return undefined;
  } finally {
    // A detached write must not unlock a newer creation after re-entry.
    if (store.getState().mutationId === mutationId) store.setState({ mutationId: undefined });
  }
}
