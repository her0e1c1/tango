import { getAuthUid } from "@/entities/auth";
import { readCardsForTagUpdate, writeCardTagChanges } from "@/entities/card";
import { type DeckId, editDeck, readDeckTags, getDecks, mustFindDeckById } from "@/entities/deck";
import { db, writeBatch } from "@/shared/firebase";
import { showToast } from "@/shared/ui/toast";

import type { DeckEditFormFields } from "../useDeckEditFormState";
import { deckEditPageStore as store } from "../store";

export async function submitDeckEdit(
  deckId: DeckId,
  values: DeckEditFormFields,
  hasTagDraft: boolean
): Promise<boolean> {
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
  // Replay tag operations against current persistence data below, preserving concurrent additions.
  const { tags: _tags, ...deckValues } = values;
  const input = { ...deckValues, id: deckId, url: values.url ?? null };
  const changes = store.getState().tagChanges;
  const save = async (): Promise<"completed" | "pending"> => {
    const deck = mustFindDeckById(getDecks(), deckId);
    if (deck.uid !== uid) throw new Error("Deck owner does not match the authenticated user");
    if (changes.length === 0) {
      await editDeck(uid, input);
      return "completed";
    }
    const registered = await readDeckTags(uid, deckId);
    const cards = await readCardsForTagUpdate(uid, deckId);
    let tags = [...new Set([...registered, ...cards.flatMap((card) => card.tags)])];
    for (const { previous, name } of changes) {
      if (previous !== undefined && !tags.includes(previous)) throw new Error("Tag no longer exists");
      tags = tags.filter((tag) => tag !== previous);
      if (name !== undefined && !tags.includes(name)) tags.push(name);
    }
    const batch = writeBatch(db);
    await editDeck(uid, input, { batch, tags });
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
