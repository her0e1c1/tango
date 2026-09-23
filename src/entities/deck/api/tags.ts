import { doc, type Transaction } from "firebase/firestore";

import { db } from "@/shared/firebase";
import { authenticatedUidSchema, deckIdSchema } from "../model/schema";
import { parseDeckDocument } from "./document";

export async function readDeckTags(transaction: Transaction, uid: string, deckId: string): Promise<string[]> {
  authenticatedUidSchema.parse(uid);
  deckIdSchema.parse(deckId);
  const snapshot = await transaction.get(doc(db, "deck", deckId));
  const deck = parseDeckDocument(deckId, snapshot.data());
  if (deck.uid !== uid || deck.deletedAt !== null) throw new Error("Deck is unavailable");
  return deck.tags ?? [];
}

// The caller reads ownership in the same transaction before preparing this write.
export function writeDeckTags(transaction: Transaction, deckId: string, tags: string[]): void {
  transaction.update(doc(db, "deck", deckId), { tags, updatedAt: Date.now() });
}
