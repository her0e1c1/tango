import { getAuthUid } from "@/entities/auth";
import { readCardsForTagUpdate, writeCardTagChanges } from "@/entities/card";
import { type DeckId, editDeck, readDeckTags, writeDeckEdit } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { db, writeBatch } from "@/shared/firebase";
import { showToast } from "@/shared/ui/toast";

import { deckEditPageStore as store } from "../store";

export async function submitDeckEdit(deckId: DeckId, values: DeckFormFields, hasTagDraft: boolean): Promise<boolean> {
  if (
    hasTagDraft ||
    store.getState().pendingTagSave !== undefined ||
    store.getState().deletionTarget !== undefined ||
    store.getState().deletionId !== undefined
  )
    return false;
  const pending = store.getState().submission;
  if (pending !== undefined) {
    // Keep concurrent submissions pending, but let only the original caller navigate.
    await pending;
    return false;
  }

  const uid = getAuthUid();
  const input = { ...values, id: deckId, url: values.url ?? null };
  const changes = store.getState().tagChanges;
  const save = async (): Promise<"completed" | "pending"> => {
    if (changes.length === 0) {
      await editDeck(uid, input);
      return "completed";
    }
    const registered = await readDeckTags(uid, deckId);
    const cards = await readCardsForTagUpdate(uid, deckId);
    const tags = [...new Set([...registered, ...cards.flatMap((card) => card.tags)])];
    for (const { previous, name } of changes) {
      if (previous !== undefined) {
        const index = tags.indexOf(previous);
        if (index < 0) throw new Error("Tag no longer exists");
        tags.splice(index, 1);
      }
      if (name !== undefined && !tags.includes(name)) tags.push(name);
    }
    const batch = writeBatch(db);
    writeDeckEdit(batch, uid, input, tags);
    const cardUpdates = writeCardTagChanges(batch, cards, changes);
    void batch.commit().catch(() => undefined);
    store.setState({ pendingTagSave: { deckId, name: input.name, tags, cards: cardUpdates } });
    return "pending";
  };
  const submission = save()
    .then((result) => {
      if (result === "pending") return false;
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
