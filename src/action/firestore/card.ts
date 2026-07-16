import {
  getFirestore,
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
import { getTimestamp } from "@/action/firestore/mocked";
import { buildCardCreateDto, buildCardUpdateDto, mapCardDocument, type CardDocument } from "@/action/firestore/dto";

const db = getFirestore();

export const readAll = async (uid: string, firestore: Firestore = db): Promise<Card[]> => {
  const snapshot = await getDocs(query(collection(firestore, "card"), where("uid", "==", uid)));
  return snapshot.docs
    .map((document) => mapCardDocument(document.id, document.data() as CardDocument))
    .filter((card) => card.deletedAt === null);
};

export const create = async (card: Card, createdAt?: number): Promise<string> => {
  if (createdAt == null) {
    createdAt = getTimestamp();
  }
  const ref = doc(db, "card", card.id);
  await setDoc(ref, buildCardCreateDto(card, createdAt));
  return card.id;
};

export const update = async (card: CardEdit) => {
  const ref = doc(db, "card", card.id);
  await updateDoc(ref, buildCardUpdateDto(card, getTimestamp()));
};

export const bulkUpdate = async (cards: Card[]) => {
  await Promise.all(
    cards
      .filter((c) => c.id != null)
      .map(async (c) => {
        await update(c);
      })
  );
};

export const logicalRemove = async (id: string) => {
  const updatedAt = getTimestamp();
  const ref = doc(db, "card", id);
  await updateDoc(ref, { updatedAt, deletedAt: updatedAt });
};

// used only for test
export const remove = async (id: string) => {
  const ref = doc(db, "card", id);
  await deleteDoc(ref);
};

export const exists = async (id: string): Promise<boolean> => {
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
