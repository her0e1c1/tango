import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";

import { getDb } from "@/shared/firestore";

export { create, exists, readAll, update } from "@/entities/deck/api/firestore";

/**
 * Splits a card list into batches no larger than the requested maximum.
 * Firestore batch limits can then be respected without dropping or reordering cards.
 */
export const splitCards = <T>(cards: T[], max: number): T[][] => {
  if (!(max > 0)) return [];

  const chunkSize = Math.ceil(max);
  const css = [] as T[][];
  let i = 0;
  while (i < cards.length) {
    const cs = cards.slice(i, i + chunkSize);
    if (cs.length === 0) {
      break;
    }
    css.push(cs);
    i += cs.length;
  }
  return css;
};

/**
 * Permanently deletes a deck and each card that belongs to it from Firestore.
 * Child cards are split into safe batch sizes before the deck document itself is removed.
 */
export const remove = async (deckId: string, uid: string) => {
  const db = getDb();
  const q = query(collection(db, "card"), where("uid", "==", uid), where("deckId", "==", deckId));
  const snapshot = await getDocs(q);
  const childResults = await Promise.allSettled(snapshot.docs.map((document) => deleteDoc(document.ref)));
  const childFailure = childResults.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (childFailure != null) throw childFailure.reason;
  const ref = doc(db, "deck", deckId);
  await deleteDoc(ref);
};
