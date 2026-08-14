import type { Card, CardCreate, CardCreateInput, CardEdit, DeleteCardInput, EditCardInput } from "../model/types";

import { collection, doc, setDoc, updateDoc } from "firebase/firestore";

import { db, getTimestamp, omitUndefined } from "@/shared/firebase";
import { createCardSchema, deleteCardSchema, editCardSchema } from "../model/schema";

const CARD_COLLECTION = "card";

export const generateCardId = (): string => doc(collection(db, CARD_COLLECTION)).id;

const createCardDocument = async (card: CardCreate): Promise<void> => {
  const createdAt = getTimestamp();
  const document = omitUndefined({ ...card, createdAt, updatedAt: createdAt } satisfies Card);
  await setDoc(doc(db, CARD_COLLECTION, card.id), document);
};

export const createCard = async (uid: string, card: CardCreateInput): Promise<void> => {
  const input = createCardSchema.parse({ uid, card });
  await createCardDocument(input.card);
};

const updateCardDocument = async (card: CardEdit): Promise<void> => {
  const document = omitUndefined({
    frontText: card.frontText,
    backText: card.backText,
    tags: card.tags,
    uniqueKey: card.uniqueKey,
    url: card.url,
    startLine: card.startLine,
    endLine: card.endLine,
    updatedAt: getTimestamp(),
  });
  await updateDoc(doc(db, CARD_COLLECTION, card.id), document);
};

export const editCard = async (uid: string, card: EditCardInput["card"]): Promise<void> => {
  const input = editCardSchema.parse({ uid, card });
  await updateCardDocument(input.card);
};

const removeCardDocument = async (id: string): Promise<void> => {
  const updatedAt = getTimestamp();
  await updateDoc(doc(db, CARD_COLLECTION, id), { updatedAt, deletedAt: updatedAt });
};

export const deleteCard = async (uid: string, card: DeleteCardInput["card"]): Promise<void> => {
  const input = deleteCardSchema.parse({ uid, card });
  await removeCardDocument(input.card.id);
};
