import { getAuthUid } from "@/entities/auth";
import { createDeck, generateDeckId, type DeckId } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { showToast } from "@/shared/ui/toast";

import { deckCreatePageStore as store } from "../store";

export async function submitDeckCreation(
  values: DeckFormFields,
  isMounted: () => boolean,
  onCreated: (deckId: DeckId) => void
): Promise<void> {
  if (store.getState().mutationId !== undefined) return;
  // Lock synchronously so submissions cannot outrun the form's next render.
  const mutationId = Symbol();
  store.setState({ mutationId });
  let deckId: DeckId;
  try {
    const uid = getAuthUid();
    deckId = generateDeckId();
    const deck = {
      id: deckId,
      name: values.name,
      category: values.category,
      convertToBr: values.convertToBr,
      ...(values.url === undefined ? {} : { url: values.url }),
    };
    await createDeck(uid, values.localMode ? { ...deck, localMode: true } : { ...deck, localMode: false });
    // Writes survive navigation, but resetting the store detaches their results.
    if (store.getState().mutationId !== mutationId) return;
    showToast({ messageKey: "deckForm.toast.created", messageParams: { name: values.name }, tone: "success" });
  } catch {
    if (store.getState().mutationId === mutationId) {
      showToast({ messageKey: "deckForm.toast.createFailure", tone: "error" });
    }
    return;
  } finally {
    // A detached write must not unlock a newer creation after re-entry.
    if (store.getState().mutationId === mutationId) store.setState({ mutationId: undefined });
  }
  // Only the still-mounted Page may navigate; routing failures must not be reported as save failures.
  if (isMounted()) onCreated(deckId);
}
