import { doc, getDocFromCache, type WriteBatch } from "firebase/firestore";

import { db } from "@/shared/firebase";
import { authenticatedUidSchema, deckIdSchema } from "../model/schema";
import { parseDeckDocument } from "./document";

export async function readDeckTags(uid: string, deckId: string): Promise<string[]> {
  authenticatedUidSchema.parse(uid);
  deckIdSchema.parse(deckId);
  const snapshot = await getDocFromCache(doc(db, "deck", deckId));
  const deck = parseDeckDocument(deckId, snapshot.data());
  if (deck.uid !== uid || deck.deletedAt !== null) throw new Error("Deck is unavailable");
  return deck.tags ?? [];
}

// The caller validates the current cached Deck before preparing this batch.
export function writeDeckTags(batch: WriteBatch, deckId: string, tags: string[]) {
  const reference = doc(db, "deck", deckId);
  batch.update(reference, { tags, updatedAt: Date.now() });
  return reference;
}
