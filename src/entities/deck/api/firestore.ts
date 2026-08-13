import type { Deck, DeckEdit } from "../model/deck";

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
import { buildDeckCreateDto, buildDeckUpdateDto, mapDeckDocument } from "./firestoreDocument";

const DECK_COLLECTION = "deck";

export const generateDeckId = (): string => doc(collection(getDb(), DECK_COLLECTION)).id;

export const readAll = async (uid: string, firestore: Firestore = getDb()): Promise<Deck[]> => {
  const snapshot = await getDocs(query(collection(firestore, DECK_COLLECTION), where("uid", "==", uid)));
  return snapshot.docs
    .map((document) => mapDeckDocument(document.id, document.data()))
    .filter((deck) => deck.deletedAt === null);
};

export const create = async (deck: Deck): Promise<string> => {
  const createdAt = getTimestamp();
  await setDoc(doc(getDb(), DECK_COLLECTION, deck.id), buildDeckCreateDto(deck, createdAt));
  return deck.id;
};

export const update = async (deck: DeckEdit): Promise<void> => {
  await updateDoc(doc(getDb(), DECK_COLLECTION, deck.id), buildDeckUpdateDto(deck, getTimestamp()));
};

export const remove = async (deckId: string, uid: string): Promise<void> => {
  const db = getDb();
  const cardQuery = query(collection(db, "card"), where("uid", "==", uid), where("deckId", "==", deckId));
  const snapshot = await getDocs(cardQuery);
  const childResults = await Promise.allSettled(snapshot.docs.map((document) => deleteDoc(document.ref)));
  const childFailure = childResults.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (childFailure != null) throw childFailure.reason;

  await deleteDoc(doc(db, DECK_COLLECTION, deckId));
};

export const exists = async (id: string): Promise<boolean> =>
  (await getDoc(doc(getDb(), DECK_COLLECTION, id))).exists();
