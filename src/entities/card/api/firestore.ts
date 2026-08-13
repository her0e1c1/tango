import type { Card, CardEdit } from "../model/card";
import { createStudyProgressFromCard, mapStudyProgressDocument } from "@/entities/study-progress/@x/card";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import { getDb, getTimestamp } from "@/shared/firestore";
import { buildCardCreateDto, buildCardUpdateDto, mapCardDocument } from "./firestoreDocument";

const CARD_COLLECTION = "card";

export const generateCardId = (): string => doc(collection(getDb(), CARD_COLLECTION)).id;

export const readAll = async (uid: string, firestore: Firestore = getDb()): Promise<Card[]> => {
  const snapshot = await getDocs(query(collection(firestore, CARD_COLLECTION), where("uid", "==", uid)));
  return snapshot.docs
    .map((document) => ({
      ...mapCardDocument(document.id, document.data()),
      ...mapStudyProgressDocument(document.id, document.data()),
      id: document.id,
    }))
    .filter((card) => card.deletedAt === null);
};

export const create = async (card: Card, createdAt?: number): Promise<string> => {
  await setDoc(
    doc(getDb(), CARD_COLLECTION, card.id),
    buildCardCreateDto(card, createStudyProgressFromCard(card), createdAt ?? getTimestamp())
  );
  return card.id;
};

export const upsert = async (card: Card): Promise<string> => {
  const timestamp = getTimestamp();
  const createdAt = card.createdAt > 0 ? card.createdAt : timestamp;
  await setDoc(doc(getDb(), CARD_COLLECTION, card.id), {
    ...buildCardCreateDto(card, createStudyProgressFromCard(card), createdAt),
    updatedAt: timestamp,
  });
  return card.id;
};

export const update = async (card: CardEdit): Promise<void> => {
  await updateDoc(doc(getDb(), CARD_COLLECTION, card.id), buildCardUpdateDto(card, getTimestamp()));
};

export const bulkUpdate = async (cards: Card[]): Promise<void> => {
  await Promise.all(cards.filter((card) => card.id != null).map(update));
};

export const logicalRemove = async (id: string): Promise<void> => {
  const updatedAt = getTimestamp();
  await updateDoc(doc(getDb(), CARD_COLLECTION, id), { updatedAt, deletedAt: updatedAt });
};

export const remove = async (id: string): Promise<void> => {
  await deleteDoc(doc(getDb(), CARD_COLLECTION, id));
};

export const exists = async (id: string): Promise<boolean> => {
  try {
    return (await getDoc(doc(getDb(), CARD_COLLECTION, id))).exists();
  } catch {
    return false;
  }
};
