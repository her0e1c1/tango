import type { Card, CardCreate } from "@/entities/card";

import { collection, doc, setDoc } from "firebase/firestore";

import { db } from "@/shared/firebase";
import { getTimestamp, omitUndefined } from "@/shared/firestore";

export const generateCardId = (): string => doc(collection(db, "card")).id;

export const createCardDocument = async (card: CardCreate): Promise<string> => {
  const createdAt = getTimestamp();
  const document = omitUndefined({ ...card, createdAt, updatedAt: createdAt } satisfies Card);
  await setDoc(doc(db, "card", card.id), document);
  return card.id;
};
