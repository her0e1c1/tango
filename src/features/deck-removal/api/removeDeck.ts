import { collection, getDocs, query, where, writeBatch, type Firestore } from "firebase/firestore";

import { removeDeckDocument } from "@/entities/deck";
import { getDb } from "@/shared/firestore";

export const CARD_DELETE_BATCH_SIZE = 450;

export const removeDeckWithCards = async (
  deckId: string,
  uid: string,
  firestore: Firestore = getDb()
): Promise<void> => {
  const cardQuery = query(collection(firestore, "card"), where("uid", "==", uid), where("deckId", "==", deckId));
  const snapshot = await getDocs(cardQuery);

  for (let offset = 0; offset < snapshot.docs.length; offset += CARD_DELETE_BATCH_SIZE) {
    const batch = writeBatch(firestore);
    snapshot.docs.slice(offset, offset + CARD_DELETE_BATCH_SIZE).forEach((document) => {
      batch.delete(document.ref);
    });
    await batch.commit();
  }

  await removeDeckDocument(deckId, firestore);
};
