/**
 * @file Implements the Firestore adapter responsibility for Deck.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */
import type { Deck, DeckEdit } from "../model/deck";

import {
  where,
  doc,
  updateDoc,
  query,
  collection,
  getDocs,
  deleteDoc,
  getDoc,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import { getTimestamp } from "@/shared/firebase/document-metadata";
import { getDb } from "@/shared/firebase/firestore-runtime";

import { buildDeckCreateDto, buildDeckUpdateDto, mapDeckDocument } from "./deckDto";

/**
 * Reads every active deck owned by the requested user from Firestore.
 * Deleted documents are filtered out after storage data is mapped into Tango's application model.
 */
export const readAll = async (uid: string, firestore: Firestore = getDb()): Promise<Deck[]> => {
  const snapshot = await getDocs(query(collection(firestore, "deck"), where("uid", "==", uid)));
  return snapshot.docs
    .map((document) => mapDeckDocument(document.id, document.data()))
    .filter((deck) => deck.deletedAt === null);
};

/**
 * Creates a new deck document in Firestore.
 * The adapter adds storage timestamps and returns the identifier that callers use for later
 * operations.
 */
export const create = async (deck: Deck): Promise<string> => {
  const createdAt = getTimestamp();
  const db = getDb();
  const ref = doc(db, "deck", deck.id);
  await setDoc(ref, buildDeckCreateDto(deck, createdAt));
  return deck.id;
};

/**
 * Splits a card list into batches no larger than the requested maximum.
 * Firestore batch limits can then be respected without dropping or reordering cards.
 */
export const splitCards = <T>(cards: T[], max: number): T[][] => {
  if (!(max > 0)) return [];

  const chunkSize = Math.ceil(max);
  const css = [] as T[][];
  let i = 0;
  while (i < cards.length) {
    const cs = cards.slice(i, i + chunkSize);
    if (cs.length === 0) {
      break;
    }
    css.push(cs);
    i += cs.length;
  }
  return css;
};

/**
 * Updates the requested deck document in Firestore.
 * Only editable fields are written, together with a fresh timestamp used by remote subscribers.
 */
export const update = async (deck: DeckEdit) => {
  const db = getDb();
  const ref = doc(db, "deck", deck.id);
  const updatedAt = getTimestamp();
  await updateDoc(ref, buildDeckUpdateDto(deck, updatedAt));
};

/**
 * Permanently deletes a deck and each card that belongs to it from Firestore.
 * Child cards are split into safe batch sizes before the deck document itself is removed.
 */
export const remove = async (deckId: string, uid: string) => {
  const db = getDb();
  const q = query(collection(db, "card"), where("uid", "==", uid), where("deckId", "==", deckId));
  const snapshot = await getDocs(q);
  const childResults = await Promise.allSettled(snapshot.docs.map((document) => deleteDoc(document.ref)));
  const childFailure = childResults.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (childFailure != null) throw childFailure.reason;
  const ref = doc(db, "deck", deckId);
  await deleteDoc(ref);
};

/**
 * Checks whether the requested deck document exists in Firestore.
 * Only document metadata is exposed to the caller; missing records return `false` rather than
 * throwing.
 */
export const exists = async (id: string): Promise<boolean> => {
  const db = getDb();
  const ref = doc(db, "deck", id);
  const snapshot = await getDoc(ref);
  return snapshot.exists();
};
