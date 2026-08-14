import type { Card, CardCreate } from "@/entities/card";

import { collection, doc, setDoc } from "firebase/firestore";

import { getDb, getTimestamp, omitUndefined } from "@/shared/firestore";

export const generateCardId = (): string => doc(collection(getDb(), "card")).id;

export const createCardDocument = async (card: CardCreate): Promise<string> => {
  const createdAt = getTimestamp();
  const document = omitUndefined({ ...card, createdAt, updatedAt: createdAt } satisfies Card);
  await setDoc(doc(getDb(), "card", card.id), document);
  return card.id;
};
