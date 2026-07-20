/**
 * @file Implements the Firestore adapter responsibility for Card.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

import {
  doc,
  updateDoc,
  setDoc,
  getDoc,
  deleteDoc,
  getDocs,
  query,
  collection,
  where,
  type Firestore,
} from "firebase/firestore";
import { getTimestamp } from "@/adapters/firestore/documentMetadata";
import { buildCardCreateDto, buildCardUpdateDto, mapCardDocument, type CardDocument } from "@/adapters/firestore/dto";
import { getDb } from "@/adapters/firestore/runtime";

/**
 * Reads every active card owned by the requested user from Firestore.
 * Deleted documents are filtered out after storage data is mapped into Tango's application model.
 */
export const readAll = async (uid: string, firestore: Firestore = getDb()): Promise<Card[]> => {
  const snapshot = await getDocs(query(collection(firestore, "card"), where("uid", "==", uid)));
  return snapshot.docs
    .map((document) => mapCardDocument(document.id, document.data() as CardDocument))
    .filter((card) => card.deletedAt === null);
};

/**
 * Creates a new card document in Firestore.
 * The adapter adds storage timestamps and returns the identifier that callers use for later
 * operations.
 */
export const create = async (card: Card, createdAt?: number): Promise<string> => {
  const db = getDb();
  if (createdAt == null) {
    createdAt = getTimestamp();
  }
  const ref = doc(db, "card", card.id);
  await setDoc(ref, buildCardCreateDto(card, createdAt));
  return card.id;
};

/**
 * Creates or replaces a card document in Firestore.
 * A fresh update timestamp is added so subscribers can order and reconcile the resulting change.
 */
export const upsert = async (card: Card): Promise<string> => {
  const db = getDb();
  const timestamp = getTimestamp();
  const createdAt = card.createdAt > 0 ? card.createdAt : timestamp;
  const ref = doc(db, "card", card.id);
  await setDoc(ref, { ...buildCardCreateDto(card, createdAt), updatedAt: timestamp });
  return card.id;
};

/**
 * Updates the requested card document in Firestore.
 * Only editable fields are written, together with a fresh timestamp used by remote subscribers.
 */
export const update = async (card: CardEdit) => {
  const db = getDb();
  const ref = doc(db, "card", card.id);
  await updateDoc(ref, buildCardUpdateDto(card, getTimestamp()));
};

/**
 * Updates multiple card documents as a coordinated operation.
 * Cards are prepared with the same timestamp before their Firestore writes run in parallel.
 */
export const bulkUpdate = async (cards: Card[]) => {
  await Promise.all(
    cards
      .filter((c) => c.id != null)
      .map(async (c) => {
        await update(c);
      })
  );
};

/**
 * Marks a card document as deleted without immediately erasing it.
 * This soft-delete timestamp lets synchronized clients observe the removal safely.
 */
export const logicalRemove = async (id: string) => {
  const db = getDb();
  const updatedAt = getTimestamp();
  const ref = doc(db, "card", id);
  await updateDoc(ref, { updatedAt, deletedAt: updatedAt });
};

// used only for test
/**
 * Permanently deletes one card document from Firestore for test cleanup.
 * Production card removal normally uses the soft-delete helper so other synchronized clients can
 * observe it.
 */
export const remove = async (id: string) => {
  const db = getDb();
  const ref = doc(db, "card", id);
  await deleteDoc(ref);
};

/**
 * Checks whether the requested card document exists in Firestore.
 * Only document metadata is exposed to the caller; missing records return `false` rather than
 * throwing.
 */
export const exists = async (id: string): Promise<boolean> => {
  const db = getDb();
  const ref = doc(db, "card", id);
  try {
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      return true;
    }
  } catch (_) {
    // ignore permission error if not exist
  }
  return false;
};
