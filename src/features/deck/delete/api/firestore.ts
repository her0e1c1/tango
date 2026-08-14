import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";

import { db } from "@/shared/firebase";

export const deleteDeckDocuments = async (uid: string, deckId: string): Promise<void> => {
  const snapshot = await getDocs(query(collection(db, "card"), where("uid", "==", uid), where("deckId", "==", deckId)));
  await Promise.all(snapshot.docs.map((document) => deleteDoc(document.ref)));
  await deleteDoc(doc(db, "deck", deckId));
};
