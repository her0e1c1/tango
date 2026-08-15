import type {
  Deck,
  DeckCreate,
  DeckCreateInput,
  DeckEdit,
  DeckId,
  DeleteDeckInput,
  EditDeckInput,
} from "../model/types";

import { collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";
import { z } from "zod";

import { db } from "@/shared/api";
import { createDeckSchema, deleteDeckSchema, editDeckSchema } from "../model/schema";
import { replaceDecks } from "../model/store";

const DECK_COLLECTION = "deck";
const CARD_COLLECTION = "card";

class FirestoreDocumentValidationError extends Error {
  constructor(
    readonly collectionName: string,
    readonly documentId: string,
    readonly issues: z.core.$ZodIssue[]
  ) {
    const details = issues
      .map((issue) => `${issue.path.length === 0 ? "<document>" : issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    super(`Invalid Firestore ${collectionName} document "${documentId}": ${details}`);
    this.name = "FirestoreDocumentValidationError";
  }
}

const parseFirestoreDocument = <T>(
  schema: z.ZodType<T>,
  collectionName: string,
  documentId: string,
  value: unknown
): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new FirestoreDocumentValidationError(collectionName, documentId, result.error.issues);
  }
  return result.data;
};

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

const convertDeckDtoToDeck = (id: DeckId, value: unknown): Deck => {
  const dto = parseFirestoreDocument(deckDtoSchema, DECK_COLLECTION, id, value);
  const deck: Deck = { ...dto, id };
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
        replaceDecks(decks);
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );

export const fetchDecks = async (uid: string): Promise<Deck[]> => {
  const snapshot = await getDocs(query(collection(db, DECK_COLLECTION), where("uid", "==", uid)));
  return snapshot.docs
    .map((document) => convertDeckDtoToDeck(document.id, document.data()))
    .filter((deck) => deck.deletedAt === null);
};

export const generateDeckId = (): string => doc(collection(db, DECK_COLLECTION)).id;

const createDeckDocument = async (deck: DeckCreate): Promise<void> => {
  const createdAt = Date.now();
  const document = { ...deck, createdAt, updatedAt: createdAt } satisfies Deck;
  await setDoc(doc(db, DECK_COLLECTION, deck.id), document);
};

export const createDeck = async (uid: string, deck: DeckCreateInput): Promise<void> => {
  const input = createDeckSchema.parse({ uid, deck });
  await createDeckDocument(input.deck);
};

const updateDeckDocument = async (deck: DeckEdit): Promise<void> => {
  const document = {
    name: deck.name,
    url: deck.url,
    isPublic: deck.isPublic,
    updatedAt: Date.now(),
    scoreMax: deck.scoreMax,
    scoreMin: deck.scoreMin,
    selectedTags: deck.selectedTags,
    tagAndFilter: deck.tagAndFilter,
    category: deck.category,
    convertToBr: deck.convertToBr,
  };
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
