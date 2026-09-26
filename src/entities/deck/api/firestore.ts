import type { z } from "zod";
import type { DeckId, RemoteDeckCreateInput } from "../model/types";
import {
  onSnapshot,
  collection,
  deleteField,
  doc,
  serverTimestamp,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/shared/firebase";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import {
  authenticatedUidSchema,
  createDeckSchema,
  type deckEditSchema,
  deckIdSchema,
  editDeckSchema,
} from "../model/schema";
import { applyDeckSnapshot } from "../model/store";
import { parseDeckDocument, toDeck, toDeckDocument } from "./document";

const DECK_COLLECTION = "deck";

// Include tombstones; the Store exposes only active documents.
export function subscribeDecks(uid: string, onError: (error: Error) => void, onReady?: () => void): () => void {
  return onSnapshot(
    query(collection(db, DECK_COLLECTION), where("uid", "==", uid)),
    { includeMetadataChanges: true },
    (snapshot) => {
      try {
        const values = snapshot.docs.map((item) => {
          const document = parseDeckDocument(item.id, item.data({ serverTimestamps: "estimate" }));
          return document.deletedAt === null ? toDeck(item.id, document) : null;
        });
        applyDeckSnapshot(values);
        onReady?.();
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    },
    onError
  );
}

export async function createDeck(uid: string, deck: RemoteDeckCreateInput): Promise<void> {
  const input = createDeckSchema.parse({ uid, deck });
  const createdAt = Date.now();
  const document = toDeckDocument(input.uid, input.deck, createdAt);
  const reference = doc(db, DECK_COLLECTION, input.deck.id);
  const write = setDoc(reference, document);
  if (auth.currentUser?.isAnonymous) void write.catch(globalThis.reportError);
  else await write;
}

export async function editDeck(uid: string, deck: z.input<typeof deckEditSchema>): Promise<void> {
  const input = editDeckSchema.parse({ uid, deck });
  const document = omitUndefined({
    name: input.deck.name,
    url: input.deck.url === null ? deleteField() : input.deck.url,
    isPublic: input.deck.isPublic,
    updatedAt: serverTimestamp(),
    selectedTags: input.deck.selectedTags,
    tagAndFilter: input.deck.tagAndFilter,
    cardFilter: input.deck.cardFilter,
    category: input.deck.category,
    convertToBr: input.deck.convertToBr,
  });
  const reference = doc(db, DECK_COLLECTION, input.deck.id);
  const write = updateDoc(reference, document);
  if (auth.currentUser?.isAnonymous) void write.catch(globalThis.reportError);
  else await write;
}

export async function deleteDeck(uid: string, deckId: DeckId): Promise<void> {
  authenticatedUidSchema.parse(uid);
  const id = deckIdSchema.parse(deckId);
  // A parent tombstone hides all children, including Cards not yet present in this device's cache.
  // This keeps deletion atomic and offline-capable for decks of any size.
  const reference = doc(db, DECK_COLLECTION, id);
  const deletedAt = Date.now();
  const write = updateDoc(reference, { deletedAt, updatedAt: serverTimestamp() });
  if (auth.currentUser?.isAnonymous) void write.catch(globalThis.reportError);
  else await write;
}
