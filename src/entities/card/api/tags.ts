import {
  collection,
  getDocsFromCache,
  query,
  where,
  type DocumentReference,
  type WriteBatch,
} from "firebase/firestore";

import { db } from "@/shared/firebase";
import { parseCardDocument } from "./document";

/** Read all cached active Cards, including earlier writes still waiting to sync. */
export async function readCardsForTagUpdate(uid: string, deckId: string) {
  if (!uid || !deckId) throw new Error("A user and Deck are required");
  const snapshot = await getDocsFromCache(
    query(
      collection(db, "card"),
      where("uid", "==", uid),
      where("deckId", "==", deckId),
      where("deletedAt", "==", null)
    )
  );
  return snapshot.docs.map((document) => {
    const card = parseCardDocument(document.id, document.data());
    if (card.uid !== uid || card.deckId !== deckId) throw new Error("Card ownership changed");
    return { reference: document.ref, tags: card.tags };
  });
}

export function writeCardTagChanges(
  batch: WriteBatch,
  cards: Awaited<ReturnType<typeof readCardsForTagUpdate>>,
  previous: string,
  replacement: string | undefined
) {
  const references: DocumentReference[] = [];
  for (const card of cards) {
    if (previous === replacement || !card.tags.includes(previous)) continue;
    const tags = [
      ...new Set(
        card.tags.flatMap((tag) => (tag === previous ? (replacement === undefined ? [] : [replacement]) : [tag]))
      ),
    ];
    batch.update(card.reference, { tags, updatedAt: Date.now() });
    references.push(card.reference);
  }
  return references;
}
