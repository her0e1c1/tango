import { getAuthUid } from "@/entities/auth";
import { readCardsForTagUpdate, writeCardTagChanges } from "@/entities/card";
import { type DeckId, editDeck, readDeckTags, getDecks, mustFindDeckById } from "@/entities/deck";
import { db, writeBatch } from "@/shared/firebase";
import { showToast } from "@/shared/ui/toast";

import type { DeckEditFormFields } from "../useDeckEditFormState";
import { getTagChanges } from "../queries/getTagChanges";
import { deckEditPageStore as store } from "../store";

export interface PendingDeckSave {
  deckId: string;
  name: string;
  tags: string[];
  cards: { id: string; tags: string[] }[];
}

export async function submitDeckEdit(
  deckId: DeckId,
  values: DeckEditFormFields,
  originalTags: readonly (string | null | undefined)[]
): Promise<boolean | PendingDeckSave> {
  if (store.getState().deletionTarget !== undefined || store.getState().deletionId !== undefined) return false;
  const pending = store.getState().submission;
  if (pending !== undefined) {
    // Keep concurrent submissions pending, but let only the original caller navigate.
    await pending;
    return false;
  }

  const uid = getAuthUid();
  // Apply tag edits to current persistence data, preserving concurrent additions.
  const { tags: tagValues = [], ...deckValues } = values;
  const input = { ...deckValues, id: deckId, url: values.url ?? null };
  const changes = getTagChanges(originalTags, tagValues);
  const save = async (): Promise<true | PendingDeckSave> => {
    const deck = mustFindDeckById(getDecks(), deckId);
    if (deck.uid !== uid) throw new Error("Deck owner does not match the authenticated user");
    if (changes.length === 0) {
      await editDeck(uid, input);
      return true;
    }
    const registered = await readDeckTags(uid, deckId);
    const cards = await readCardsForTagUpdate(uid, deckId);
    const current = [...new Set([...registered, ...cards.flatMap((card) => card.tags)])];
    if (changes.some(({ previous }) => previous !== undefined && !current.includes(previous))) {
      throw new Error("Tag no longer exists");
    }
    const replaced = new Set(changes.map(({ previous }) => previous));
    const tags = [
      ...new Set([
        ...current.filter((tag) => !replaced.has(tag)),
        ...changes.flatMap(({ name }) => (name === undefined ? [] : [name])),
      ]),
    ];
    const batch = writeBatch(db);
    await editDeck(uid, input, { batch, tags });
    const cardUpdates = writeCardTagChanges(batch, cards, changes);
    void batch.commit().catch(() => undefined);
    return { deckId, name: input.name, tags, cards: cardUpdates };
  };
  const submission = save()
    .then((result) => {
      if (result !== true) return result;
      // Shared Toast lifetime covers persistence that finishes after the editor unmounts.
      showToast({ messageKey: "deckForm.toast.updated", messageParams: { name: input.name }, tone: "success" });
      return true;
    })
    .catch(() => {
      showToast({ messageKey: "toast.saveFailure", tone: "error" });
      return false;
    });
  store.setState({ submission });

  let saved: boolean | PendingDeckSave = false;
  try {
    saved = await submission;
    return store.getState().submission === submission ? saved : false;
  } finally {
    // An earlier visit must never release the current editor's save.
    if (typeof saved === "boolean" && store.getState().submission === submission)
      store.setState({ submission: undefined });
  }
}
