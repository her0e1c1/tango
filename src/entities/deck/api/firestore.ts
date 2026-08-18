import type { z } from "zod";
import type { Deck, DeckCreateInput, DeckId } from "../model/types";

import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/shared/firebase";
import { getCurrentTimeMillis } from "@/shared/lib/currentTime";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import {
  authenticatedUidSchema,
  createDeckSchema,
  type deckEditSchema,
  deckIdSchema,
  editDeckSchema,
} from "../model/schema";
import { replaceRemoteDecks } from "../model/store";
import { parseDeckDocument, toDeck, toDeckDocument } from "./document";

const DECK_COLLECTION = "deck";
const CARD_COLLECTION = "card";

// Parses an active remote Deck while omitting tombstoned documents.
const readActiveRemoteDeck = (id: DeckId, value: unknown) => {
  const document = parseDeckDocument(id, value);
  return document.deletedAt === null ? toDeck(id, document) : undefined;
};

// Subscribes the remote Deck store to active documents owned by one user.
export const subscribeDecks = (uid: string, onError: (error: Error) => void): (() => void) =>
  onSnapshot(
    query(collection(db, DECK_COLLECTION), where("uid", "==", uid)),
    (snapshot) => {
      try {
        const decks = snapshot.docs.flatMap((document) => {
          const deck = readActiveRemoteDeck(document.id, document.data());
          return deck === undefined ? [] : [deck];
        });
        replaceRemoteDecks(decks);
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );

/** Fetches active remote Decks so import validation does not depend on listener timing. */
export const fetchDecks = async (uid: string): Promise<Deck[]> => {
  const snapshot = await getDocsFromServer(query(collection(db, DECK_COLLECTION), where("uid", "==", uid)));
  return snapshot.docs.flatMap((document) => {
    const deck = readActiveRemoteDeck(document.id, document.data());
    return deck === undefined ? [] : [deck];
  });
};

// Writes a new Deck document with synchronized creation and update timestamps.
const createDeckDocument = async (deck: z.infer<typeof createDeckSchema>["deck"]): Promise<void> => {
  const createdAt = getCurrentTimeMillis();
  const document = toDeckDocument(deck, createdAt);
  await setDoc(doc(db, DECK_COLLECTION, deck.id), document);
};

// Validates Deck ownership before creating its Firestore document.
export const createDeck = async (uid: string, deck: DeckCreateInput): Promise<void> => {
  const input = createDeckSchema.parse({ uid, deck });
  await createDeckDocument(input.deck);
};

// Writes editable Deck fields and advances the update timestamp.
const updateDeckDocument = async (deck: z.infer<typeof deckEditSchema>): Promise<void> => {
  const document = omitUndefined({
    name: deck.name,
    url: deck.url === null ? deleteField() : deck.url,
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

// Validates an authenticated Deck edit before updating Firestore.
export const editDeck = async (uid: string, deck: z.input<typeof deckEditSchema>): Promise<void> => {
  const input = editDeckSchema.parse({ uid, deck });
  await updateDeckDocument(input.deck);
};

// Deletes a remote Deck and every child Card document owned by the same user.
const deleteDeckDocuments = async (uid: string, deckId: string): Promise<void> => {
  // Remove child Cards first so a partial failure leaves a recoverable Deck instead of orphaned Card documents.
  const snapshot = await getDocs(
    query(collection(db, CARD_COLLECTION), where("uid", "==", uid), where("deckId", "==", deckId))
  );
  await Promise.all(snapshot.docs.map((document) => deleteDoc(document.ref)));
  await deleteDoc(doc(db, DECK_COLLECTION, deckId));
};

// Validates Deck ownership before deleting its remote document graph.
export const deleteDeck = async (uid: string, deckId: DeckId): Promise<void> => {
  const userId = authenticatedUidSchema.parse(uid);
  const id = deckIdSchema.parse(deckId);
  await deleteDeckDocuments(userId, id);
};
