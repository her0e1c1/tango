import { collection, getDocs, query, where, writeBatch } from "firebase/firestore";

import { removeDeckDocument } from "@/entities/deck";
import { getDb } from "@/shared/firestore";

export const CARD_DELETE_BATCH_SIZE = 450;

export const removeDeckWithCards = async (deckId: string, uid: string): Promise<void> => {
  const db = getDb();
  const cardQuery = query(collection(db, "card"), where("uid", "==", uid), where("deckId", "==", deckId));
  const snapshot = await getDocs(cardQuery);

  for (let offset = 0; offset < snapshot.docs.length; offset += CARD_DELETE_BATCH_SIZE) {
    const batch = writeBatch(db);
    snapshot.docs.slice(offset, offset + CARD_DELETE_BATCH_SIZE).forEach((document) => {
      batch.delete(document.ref);
    });
    await batch.commit();
  }

  await removeDeckDocument(deckId);
};
