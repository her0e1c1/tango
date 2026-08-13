import { type Card, parseCardCreateDto } from "@/entities/card";

import { collection, doc, setDoc } from "firebase/firestore";

import { getDb, getTimestamp, omitUndefined } from "@/shared/firestore";

export const generateCardId = (): string => doc(collection(getDb(), "card")).id;

export const createCardDocument = async (card: Card): Promise<string> => {
  const createdAt = getTimestamp();
  const document = parseCardCreateDto(
    card.id,
    omitUndefined({ ...card, createdAt, updatedAt: createdAt, deletedAt: null })
  );
  await setDoc(doc(getDb(), "card", card.id), document);
  return card.id;
};
