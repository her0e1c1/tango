import { collection, getDocsFromServer, query, where, type Transaction } from "firebase/firestore";

import { db } from "@/shared/firebase";
import { parseCardDocument } from "./document";

/** Read the complete owned Deck, independent of the browsing filter or local cache. */
export async function readCardsForTagUpdate(transaction: Transaction, uid: string, deckId: string) {
  if (!uid || !deckId) throw new Error("A user and Deck are required");
  const snapshot = await getDocsFromServer(
    query(collection(db, "card"), where("uid", "==", uid), where("deckId", "==", deckId))
  );
  // Re-read within the transaction so edits to existing Cards retry instead of losing their other tags.
  const documents = await Promise.all(snapshot.docs.map((card) => transaction.get(card.ref)));
  return documents.flatMap((document) => {
    const card = parseCardDocument(document.id, document.data());
    if (card.uid !== uid || card.deckId !== deckId) throw new Error("Card ownership changed");
    return card.deletedAt === null ? [{ reference: document.ref, tags: card.tags }] : [];
  });
}

export function writeCardTagChanges(
  transaction: Transaction,
  cards: Awaited<ReturnType<typeof readCardsForTagUpdate>>,
  previous: string,
  replacement: string | undefined
): void {
  for (const card of cards) {
    if (!card.tags.includes(previous)) continue;
    const tags = [
      ...new Set(
        card.tags.flatMap((tag) => (tag === previous ? (replacement === undefined ? [] : [replacement]) : [tag]))
      ),
    ];
    transaction.update(card.reference, { tags, updatedAt: Date.now() });
  }
}
