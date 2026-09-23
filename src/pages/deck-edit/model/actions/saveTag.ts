import { getAuthUid } from "@/entities/auth";
import { readCardsForTagUpdate, writeCardTagChanges } from "@/entities/card";
import { readDeckTags, writeDeckTags } from "@/entities/deck";
import { transact } from "@/shared/firestore-transaction";
import { showToast } from "@/shared/ui/toast";

import { deckEditPageStore as store } from "../store";

export async function saveTag(deckId: string, name: string | undefined, previous?: string): Promise<boolean> {
  const state = store.getState();
  if (
    state.tagMutation !== undefined ||
    state.submission !== undefined ||
    state.deletionTarget !== undefined ||
    state.deletionId !== undefined
  )
    return false;
  if (name !== undefined && name.trim().length === 0) {
    store.setState({ tagError: "required" });
    return false;
  }
  const mutation = Symbol("tag-update");
  store.setState({ tagMutation: mutation, tagError: undefined });
  try {
    const uid = getAuthUid();
    const result = await transact(async (transaction) => {
      const registered = await readDeckTags(transaction, uid, deckId);
      const cards = await readCardsForTagUpdate(transaction, uid, deckId);
      const tags = [...new Set([...registered, ...cards.flatMap((card) => card.tags)])];
      if (name !== undefined && name !== previous && tags.includes(name)) return "duplicate";
      if (previous !== undefined && !tags.includes(previous)) throw new Error("Tag no longer exists");
      const next = tags.filter((tag) => tag !== previous);
      if (name !== undefined) next.push(name);
      writeDeckTags(transaction, deckId, next);
      if (previous !== undefined) writeCardTagChanges(transaction, cards, previous, name);
      return undefined;
    });
    if (store.getState().tagMutation !== mutation) return false;
    if (result !== undefined) {
      store.setState({ tagError: result });
      return false;
    }
    store.setState({ tagDeletion: undefined });
    showToast({ messageKey: "deckTags.saved", tone: "success" });
    return true;
  } catch {
    if (store.getState().tagMutation === mutation) showToast({ messageKey: "deckTags.failed", tone: "error" });
    return false;
  } finally {
    if (store.getState().tagMutation === mutation) store.setState({ tagMutation: undefined });
  }
}
