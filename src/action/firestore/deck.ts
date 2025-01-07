import {
  where,
  getFirestore,
  doc,
  updateDoc,
  query,
  collection,
  getDocs,
  deleteDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { getTimestamp } from "./mocked";

const db = getFirestore();

export const create = async (deck: Deck): Promise<string> => {
  const createdAt = getTimestamp();
  const ref = doc(db, "deck", deck.id);
  await setDoc(ref, { ...deck, id: deck.id, createdAt, updatedAt: createdAt });
  return deck.id;
};

export const splitCards = <T>(cards: T[], max: number): T[][] => {
  const css = [] as T[][];
  let i = 0;
  for (;;) {
    const cs = [] as T[];
    while (cs.length < max && i < cards.length) {
      cs.push(cards[i]);
      i++;
    }
    if (cs.length === 0) {
      break;
    }
    css.push(cs);
  }
  return css;
};

export const update = async (deck: DeckEdit) => {
  const ref = doc(db, "deck", deck.id);
  const updatedAt = getTimestamp();
  await updateDoc(ref, { ...deck, updatedAt });
};

export const remove = async (deckId: string, uid: string) => {
  const q = query(collection(db, "card"), where("uid", "==", uid), where("deckId", "==", deckId));
  const snapshot = await getDocs(q);
  await Promise.all(
    snapshot.docs.map(async (doc) => {
      await deleteDoc(doc.ref);
    })
  );
  const ref = doc(db, "deck", deckId);
  await deleteDoc(ref);
};

export const exists = async (id: string): Promise<boolean> => {
  const db = getFirestore();
  const ref = doc(db, "deck", id);
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

// for test
export const removeAll = async () => {
  const db = getFirestore();
  const q = query(collection(db, "deck"));
  const snapshot = await getDocs(q);
  for (const doc of snapshot.docs) await deleteDoc(doc.ref);

  const q2 = query(collection(db, "card"));
  const snapshot2 = await getDocs(q2);
  for (const doc of snapshot2.docs) await deleteDoc(doc.ref);
};
