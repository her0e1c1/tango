import { generateId } from "@/shared/lib/generateId";
import { getAuthUid } from "@/entities/auth";
import { createDeck, type DeckId } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { showToast } from "@/shared/ui/toast";

import { deckCreatePageStore as store } from "../store";

export async function submitDeckCreation(
  values: DeckFormFields
): Promise<{ deckId: DeckId; name: string; mutationId: symbol } | undefined> {
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
    return { deckId, name: values.name, mutationId };
  } catch {
    if (store.getState().mutationId === mutationId) {
      store.setState({ mutationId: undefined });
      showToast({ messageKey: "deckForm.toast.createFailure", tone: "error" });
    }
    return undefined;
  }
}
