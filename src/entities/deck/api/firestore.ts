import type { z } from "zod";
import type { DeckId, RemoteDeckCreateInput } from "../model/types";
import {
  collection,
  deleteField,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  getDocFromCache,
  type WriteBatch,
} from "firebase/firestore";
import { writeLocally } from "@/shared/firestore-write";
import { db } from "@/shared/firebase";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import {
  authenticatedUidSchema,
  createDeckSchema,
  deckEditSchema,
  deckIdSchema,
  editDeckSchema,
} from "../model/schema";
import { replaceRemoteDecks } from "../model/actions/replaceRemoteDecks";
import { parseDeckDocument, toDeck, toDeckDocument } from "./document";
import { abandonStudySession } from "@/entities/study-session/@x/deck";
import { findDeckById } from "../model/queries/findDeckById";

const DECK_COLLECTION = "deck";

// Parses an active remote Deck while omitting tombstoned documents.
const readActiveRemoteDeck = (id: DeckId, value: unknown) => {
  const document = parseDeckDocument(id, value);
  return document.deletedAt === null ? toDeck(id, document) : undefined;
};

// Do not filter `deletedAt == null` in the Firestore query.
// A remote tombstone would otherwise leave the query as a removed change backed by the previous matching document,
// so this client would not receive the updated tombstone itself. Hide tombstones only when publishing the active store.
export const subscribeDecks = (uid: string, onError: (error: Error) => void, onReady?: () => void): (() => void) =>
  onSnapshot(
    query(collection(db, DECK_COLLECTION), where("uid", "==", uid)),
    (snapshot) => {
      try {
        const decks = snapshot.docs.flatMap((document) => {
          const deck = readActiveRemoteDeck(document.id, document.data());
          return deck === undefined ? [] : [deck];
        });
        replaceRemoteDecks(decks);
        onReady?.();
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );

// Writes a new Deck document with synchronized creation and update timestamps.
const createDeckDocument = async (uid: string, deck: z.infer<typeof createDeckSchema>["deck"]): Promise<void> => {
  const createdAt = Date.now();
  const document = toDeckDocument(uid, deck, createdAt);
  const reference = doc(db, DECK_COLLECTION, deck.id);
  await writeLocally(uid, [reference], () => setDoc(reference, document));
};

// Validates the actor and owner-free command before creating an actor-owned Firestore document.
export const createDeck = async (uid: string, deck: RemoteDeckCreateInput): Promise<void> => {
  const input = createDeckSchema.parse({ uid, deck });
  await createDeckDocument(input.uid, input.deck);
};

// Writes editable Deck fields and advances the update timestamp.
const updateDeckDocument = async (uid: string, deck: z.infer<typeof deckEditSchema>): Promise<void> => {
  const document = omitUndefined({
    name: deck.name,
    url: deck.url === null ? deleteField() : deck.url,
    isPublic: deck.isPublic,
    updatedAt: Date.now(),
    selectedTags: deck.selectedTags,
    tagAndFilter: deck.tagAndFilter,
    cardFilter: deck.cardFilter,
    category: deck.category,
    convertToBr: deck.convertToBr,
  });
  const reference = doc(db, DECK_COLLECTION, deck.id);
  await writeLocally(uid, [reference], () => updateDoc(reference, document));
};

// Validates an authenticated Deck edit before updating Firestore.
export const editDeck = async (uid: string, deck: z.input<typeof deckEditSchema>): Promise<void> => {
  const input = editDeckSchema.parse({ uid, deck });
  await updateDeckDocument(input.uid, input.deck);
};

// Tombstones the parent; readers hide all of its child Cards.
const deleteDeckDocuments = async (uid: string, deckId: string): Promise<void> => {
  // A parent tombstone hides all children, including Cards not yet present in this device's cache.
  // This keeps deletion atomic and offline-capable for decks of any size.
  const reference = doc(db, DECK_COLLECTION, deckId);
  const deletedAt = Date.now();
  await writeLocally(uid, [reference], () => updateDoc(reference, { deletedAt, updatedAt: deletedAt }));
};

// Validates Deck ownership before deleting its remote document graph.
export const deleteDeck = async (uid: string, deckId: DeckId): Promise<void> => {
  const userId = authenticatedUidSchema.parse(uid);
  const id = deckIdSchema.parse(deckId);
  await deleteDeckDocuments(userId, id);
};
function requireOwnedDeck(uid: string, id: DeckId): void {
  authenticatedUidSchema.parse(uid);
  const deck = findDeckById(id);
  if (deck === undefined) throw new Error(`Deck "${id}" was not found`);
  if (deck.uid !== uid) throw new Error("Deck owner does not match the authenticated user");
}

export async function editOwnedDeck(uid: string, deck: z.input<typeof deckEditSchema>): Promise<void> {
  requireOwnedDeck(uid, deck.id);
  await editDeck(uid, deckEditSchema.parse(deck));
}

export async function deleteOwnedDeck(uid: string, id: DeckId): Promise<void> {
  requireOwnedDeck(uid, id);
  await deleteDeck(uid, id);
  await abandonStudySession(id);
}

export async function readDeckTags(uid: string, deckId: string): Promise<string[]> {
  authenticatedUidSchema.parse(uid);
  deckIdSchema.parse(deckId);
  const snapshot = await getDocFromCache(doc(db, "deck", deckId));
  const deck = parseDeckDocument(deckId, snapshot.data());
  if (deck.uid !== uid || deck.deletedAt !== null) throw new Error("Deck is unavailable");
  return deck.tags ?? [];
}

// The caller validates the current cached Deck before preparing this batch.
export function writeDeckTags(batch: WriteBatch, deckId: string, tags: string[]) {
  const reference = doc(db, "deck", deckId);
  batch.update(reference, { tags, updatedAt: Date.now() });
  return reference;
}
