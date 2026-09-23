import { getAuthUid } from "@/entities/auth";
import { readCardsForTagUpdate, writeCardTagChanges } from "@/entities/card";
import { readDeckTags, writeDeckTags } from "@/entities/deck";
import { createLocalBatch } from "@/shared/firestore-write";

import { deckEditPageStore as store } from "../store";

export async function persistTagChange(
  deckId: string,
  name: string | undefined,
  previous: string | undefined,
  mutation: symbol
): Promise<boolean> {
  const uid = getAuthUid();
  const registered = await readDeckTags(uid, deckId);
  const cards = await readCardsForTagUpdate(uid, deckId);
  const tags = [...new Set([...registered, ...cards.flatMap((card) => card.tags)])];
  if (store.getState().tagMutation !== mutation) return false;
  if (name !== undefined && name !== previous && tags.includes(name)) {
    store.setState({ tagError: "duplicate" });
    return false;
  }
  if (previous !== undefined && !tags.includes(previous)) throw new Error("Tag no longer exists");
  if (name !== previous) {
    const next = tags.filter((tag) => tag !== previous);
    if (name !== undefined) next.push(name);
    // Use the same SDK queue as Card saves: pending creations/edits must precede this batch.
    const { batch, commit } = createLocalBatch(uid);
    const deckReference = writeDeckTags(batch, deckId, next);
    const cardReferences = previous === undefined ? [] : writeCardTagChanges(batch, cards, previous, name);
    await commit([deckReference, ...cardReferences]);
  }
  return true;
}
