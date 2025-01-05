import { getFirestore, doc, updateDoc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

import { getTimestamp, generateCardId } from "./mocked";

const db = getFirestore();

export const create = async (card: CardNew, createdAt?: number) => {
  const id = generateCardId();
  if (createdAt == null) {
    createdAt = getTimestamp();
  }
  const ref = doc(db, "card", id);
  await setDoc(ref, { ...card, id, createdAt, updatedAt: createdAt, deletedAt: null }); // must specify deletedAt
};

export const bulkCreate = async (cards: CardNew[], deck: Pick<Deck, "uid" | "id">, createdAt?: number) => {
  await Promise.all(
    cards.map(async (c) => {
      await create({ ...c, deckId: deck.id, uid: deck.uid }, createdAt);
    })
  );
};

export const update = async (card: Partial<Card> & { id: string }) => {
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
  } catch (e) {
    console.error(e);
  } // also, permission error
  return false;
};
