import type { z } from "zod";
import type { DeckId, RemoteDeckCreateInput } from "../model/types";

import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
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

// Writes a new Deck document with synchronized creation and update timestamps.
const createDeckDocument = async (uid: string, deck: z.infer<typeof createDeckSchema>["deck"]): Promise<void> => {
  const createdAt = getCurrentTimeMillis();
  const document = toDeckDocument(uid, deck, createdAt);
  await setDoc(doc(db, DECK_COLLECTION, deck.id), document);
};

// Validates the actor and owner-free command before creating an actor-owned Firestore document.
export const createDeck = async (uid: string, deck: RemoteDeckCreateInput): Promise<void> => {
  const input = createDeckSchema.parse({ uid, deck });
  await createDeckDocument(input.uid, input.deck);
};

// Writes editable Deck fields and advances the update timestamp.
const updateDeckDocument = async (deck: z.infer<typeof deckEditSchema>): Promise<void> => {
  const document = omitUndefined({
    name: deck.name,
    url: deck.url === null ? deleteField() : deck.url,
    updatedAt: getCurrentTimeMillis(),
    difficultyMax: deck.difficultyMax,
    difficultyMin: deck.difficultyMin,
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
  // A retry must not overlap Card deletions still running from the previous attempt.
  const cardDeletions = await Promise.allSettled(snapshot.docs.map((document) => deleteDoc(document.ref)));
  const failure = cardDeletions.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (failure !== undefined) throw failure.reason;
  await deleteDoc(doc(db, DECK_COLLECTION, deckId));
};

// Validates Deck ownership before deleting its remote document graph.
export const deleteDeck = async (uid: string, deckId: DeckId): Promise<void> => {
  const userId = authenticatedUidSchema.parse(uid);
  const id = deckIdSchema.parse(deckId);
  await deleteDeckDocuments(userId, id);
};
