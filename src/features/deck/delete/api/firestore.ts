import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";

import { getDb } from "@/shared/firestore";

export const deleteDeckDocuments = async (uid: string, deckId: string): Promise<void> => {
  const db = getDb();
  const snapshot = await getDocs(query(collection(db, "card"), where("uid", "==", uid), where("deckId", "==", deckId)));
  await Promise.all(snapshot.docs.map((document) => deleteDoc(document.ref)));
  await deleteDoc(doc(db, "deck", deckId));
};
