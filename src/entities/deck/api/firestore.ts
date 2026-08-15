import type {
  DeckCreate,
  DeckCreateInput,
  DeckEdit,
  DeckId,
  DeleteDeckInput,
  EditDeckInput,
  RemoteDeck,
} from "../model/types";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { z } from "zod";

import { db } from "@/shared/firebase";
import { parseFirestoreDocument } from "@/shared/api";
import { getCurrentTimeMillis } from "@/shared/lib/currentTime";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { createDeckSchema, deleteDeckSchema, editDeckSchema } from "../model/schema";
import { replaceRemoteDecks } from "../model/store";

const DECK_COLLECTION = "deck";
const CARD_COLLECTION = "card";

const deckDtoSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  url: z.string().optional(),
  isPublic: z.boolean(),
  uid: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  scoreMax: z.number().nullable(),
  scoreMin: z.number().nullable(),
  selectedTags: z.array(z.string()),
  tagAndFilter: z.boolean(),
  category: z.string(),
  convertToBr: z.boolean(),
});

const convertDeckDtoToDeck = (id: DeckId, value: unknown): RemoteDeck => {
  const dto = parseFirestoreDocument(deckDtoSchema, "deck", id, value);
  const deck: RemoteDeck = { ...dto, id, localMode: false };
  if (dto.url === undefined) delete deck.url;
  return deck;
};

export const subscribeDecks = (uid: string, onError: (error: Error) => void): (() => void) =>
  onSnapshot(
    query(collection(db, DECK_COLLECTION), where("uid", "==", uid)),
    (snapshot) => {
      try {
        const decks = snapshot.docs
          .map((document) => convertDeckDtoToDeck(document.id, document.data()))
          .filter((deck) => deck.deletedAt === null);
        replaceRemoteDecks(decks);
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );

export const fetchDecks = async (uid: string): Promise<RemoteDeck[]> => {
  const snapshot = await getDocsFromServer(query(collection(db, DECK_COLLECTION), where("uid", "==", uid)));
  return snapshot.docs
    .map((document) => convertDeckDtoToDeck(document.id, document.data()))
    .filter((deck) => deck.deletedAt === null);
};

const createDeckDocument = async (deck: DeckCreate): Promise<void> => {
  const createdAt = getCurrentTimeMillis();
  const document = omitUndefined({
    id: deck.id,
    uid: deck.uid,
    name: deck.name,
    url: deck.url,
    isPublic: deck.isPublic,
    scoreMax: deck.scoreMax,
    scoreMin: deck.scoreMin,
    selectedTags: deck.selectedTags,
    tagAndFilter: deck.tagAndFilter,
    category: deck.category,
    convertToBr: deck.convertToBr,
    deletedAt: deck.deletedAt,
    createdAt,
    updatedAt: createdAt,
  });
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
    updatedAt: getCurrentTimeMillis(),
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
