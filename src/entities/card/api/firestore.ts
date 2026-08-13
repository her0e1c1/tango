import type { Card } from "../model/card";

import { collection, doc, getDocs, query, where, type Firestore } from "firebase/firestore";

import { getDb } from "@/shared/firestore";
import { mapCardDocument } from "./firestoreDocument";

const CARD_COLLECTION = "card";

export const generateCardId = (): string => doc(collection(getDb(), CARD_COLLECTION)).id;

export const readAll = async (uid: string, firestore: Firestore = getDb()): Promise<Card[]> => {
  const snapshot = await getDocs(query(collection(firestore, CARD_COLLECTION), where("uid", "==", uid)));
  return snapshot.docs
    .map((document) => mapCardDocument(document.id, document.data()))
    .filter((card) => card.deletedAt === null);
};
