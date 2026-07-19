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
import { getTimestamp } from "@/adapters/firestore/mocked";
import { buildDeckCreateDto, buildDeckUpdateDto, mapDeckDocument, type DeckDocument } from "@/adapters/firestore/dto";
import { getDb } from "@/adapters/firestore/runtime";

export const readAll = async (uid: string, firestore: Firestore = getDb()): Promise<Deck[]> => {
  const snapshot = await getDocs(query(collection(firestore, "deck"), where("uid", "==", uid)));
  return snapshot.docs
    .map((document) => mapDeckDocument(document.id, document.data() as DeckDocument))
    .filter((deck) => deck.deletedAt === null);
};

export const create = async (deck: Deck): Promise<string> => {
  const createdAt = getTimestamp();
  const db = getDb();
  const ref = doc(db, "deck", deck.id);
  await setDoc(ref, buildDeckCreateDto(deck, createdAt));
  return deck.id;
};

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

export const update = async (deck: DeckEdit) => {
  const db = getDb();
  const ref = doc(db, "deck", deck.id);
  const updatedAt = getTimestamp();
  await updateDoc(ref, buildDeckUpdateDto(deck, updatedAt));
};

export const remove = async (deckId: string, uid: string) => {
  const db = getDb();
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
  const db = getDb();
  const ref = doc(db, "deck", id);
  const snapshot = await getDoc(ref);
  return snapshot.exists();
};

// for test
export const removeAll = async () => {
  const db = getDb();
  const q = query(collection(db, "deck"));
  const snapshot = await getDocs(q);
  for (const doc of snapshot.docs) await deleteDoc(doc.ref);

  const q2 = query(collection(db, "card"));
  const snapshot2 = await getDocs(q2);
  for (const doc of snapshot2.docs) await deleteDoc(doc.ref);
};
