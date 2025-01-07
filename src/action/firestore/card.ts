import { getFirestore, doc, updateDoc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { getTimestamp } from "./mocked";

const db = getFirestore();

export const create = async (card: Card, createdAt?: number): Promise<string> => {
  if (createdAt == null) {
    createdAt = getTimestamp();
  }
  const ref = doc(db, "card", card.id);
  await setDoc(ref, { ...card, createdAt, updatedAt: createdAt, deletedAt: null }); // must specify deletedAt
  return card.id;
};

export const update = async (card: CardEdit) => {
  const ref = doc(db, "card", card.id);
  await updateDoc(ref, { ...card, updatedAt: getTimestamp() });
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
