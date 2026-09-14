import { getAuthUid } from "@/entities/auth";
import { createDeck, generateDeckId, type DeckId } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { showToast } from "@/shared/ui/toast";

import { deckCreatePageStore as store } from "../store";
import { dismissSaveError } from "./dismissSaveError";

export async function submitDeckCreation(values: DeckFormFields): Promise<DeckId | undefined> {
  const { session, pending } = store.getState();
  if (session === undefined || pending) return;
  // Lock synchronously so submissions cannot outrun the form's next render.
  store.setState({ pending: true });
  dismissSaveError();
  try {
    const uid = getAuthUid();
    const deckId = generateDeckId();
    const deck = {
      id: deckId,
      name: values.name,
      category: values.category,
      convertToBr: values.convertToBr,
      ...(values.url === undefined ? {} : { url: values.url }),
    };
    await createDeck(uid, values.localMode ? { ...deck, localMode: true } : { ...deck, localMode: false });
    // Writes survive navigation, but their results belong only to the originating session.
    if (store.getState().session !== session) return;
    showToast({ messageKey: "deckForm.toast.created", messageParams: { name: values.name }, tone: "success" });
    return deckId;
  } catch {
    if (store.getState().session === session) {
      store.setState({ saveErrorToastId: showToast({ messageKey: "deckForm.toast.createFailure", tone: "error" }) });
    }
    return undefined;
  } finally {
    // An old write must not unlock a new session's pending creation.
    if (store.getState().session === session) store.setState({ pending: false });
  }
}
