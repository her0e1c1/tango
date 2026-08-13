import type { Deck } from "../model/deck";

import { collection, doc, getDocs, query, where, type Firestore } from "firebase/firestore";

import { getDb } from "@/shared/firestore";
import { mapDeckDocument } from "./firestoreDocument";

const DECK_COLLECTION = "deck";

export const generateDeckId = (): string => doc(collection(getDb(), DECK_COLLECTION)).id;

export const readAll = async (uid: string, firestore: Firestore = getDb()): Promise<Deck[]> => {
  const snapshot = await getDocs(query(collection(firestore, DECK_COLLECTION), where("uid", "==", uid)));
  return snapshot.docs
    .map((document) => mapDeckDocument(document.id, document.data()))
    .filter((deck) => deck.deletedAt === null);
};
