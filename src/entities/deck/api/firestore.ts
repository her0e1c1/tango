import type { Deck, DeckCreate, DeckCreateInput, DeckEdit, DeleteDeckInput, EditDeckInput } from "../model/types";

import { collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";

import { db } from "@/shared/firebase";
import { getTimestamp, omitUndefined } from "@/shared/firestore";
import { createDeckSchema, deleteDeckSchema, editDeckSchema } from "../model/schema";

const DECK_COLLECTION = "deck";
const CARD_COLLECTION = "card";

export const generateDeckId = (): string => doc(collection(db, DECK_COLLECTION)).id;

const createDeckDocument = async (deck: DeckCreate): Promise<void> => {
  const createdAt = getTimestamp();
  const document = omitUndefined({ ...deck, createdAt, updatedAt: createdAt } satisfies Deck);
  await setDoc(doc(db, DECK_COLLECTION, deck.id), document);
};

export const createDeck = async (uid: string, deck: DeckCreateInput): Promise<void> => {
  const input = createDeckSchema.parse({ uid, deck });
  await createDeckDocument(input.deck);
};

const updateDeckDocument = async (deck: DeckEdit): Promise<void> => {
  const document = omitUndefined({
    name: deck.name,
    url: deck.url,
    isPublic: deck.isPublic,
    updatedAt: getTimestamp(),
    scoreMax: deck.scoreMax,
    scoreMin: deck.scoreMin,
    selectedTags: deck.selectedTags,
    tagAndFilter: deck.tagAndFilter,
    category: deck.category,
    convertToBr: deck.convertToBr,
  });
  await updateDoc(doc(db, DECK_COLLECTION, deck.id), document);
};

export const editDeck = async (uid: string, deck: EditDeckInput["deck"]): Promise<void> => {
  const input = editDeckSchema.parse({ uid, deck });
  await updateDeckDocument(input.deck);
};

const deleteDeckDocuments = async (uid: string, deckId: string): Promise<void> => {
  const snapshot = await getDocs(
    query(collection(db, CARD_COLLECTION), where("uid", "==", uid), where("deckId", "==", deckId))
  );
  await Promise.all(snapshot.docs.map((document) => deleteDoc(document.ref)));
  await deleteDoc(doc(db, DECK_COLLECTION, deckId));
};

export const deleteDeck = async (uid: string, deck: DeleteDeckInput["deck"]): Promise<void> => {
  const input = deleteDeckSchema.parse({ uid, deck });
  await deleteDeckDocuments(input.uid, input.deck.id);
};
