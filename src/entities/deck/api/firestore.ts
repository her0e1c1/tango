import type { z } from "zod";
import type { DeckId, RemoteDeckCreateInput } from "../model/types";
import {
  collection,
  deleteField,
  doc,
  orderBy,
  startAt,
  Timestamp,
  serverTimestamp,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/shared/firebase";
import { subscribeSyncedQuery } from "@/shared/api";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import {
  authenticatedUidSchema,
  createDeckSchema,
  type deckEditSchema,
  deckIdSchema,
  editDeckSchema,
} from "../model/schema";
import { applyDeckSnapshot } from "../model/actions/applyDeckSnapshot";
import { deckStore } from "../model/store";
import { parseDeckDocument, toDeck, toDeckDocument } from "./document";

const DECK_COLLECTION = "deck";

// Do not filter `deletedAt == null` in the Firestore query.
// A remote tombstone would otherwise leave the query as a removed change backed by the previous matching document,
// so this client would not receive the updated tombstone itself. Hide tombstones only when publishing the active store.
export function subscribeDecks(uid: string, onError: (error: Error) => void, onReady?: () => void): () => void {
  const scope = JSON.stringify([db.app.options.projectId, uid]);
  return subscribeSyncedQuery({
    scope,
    store: deckStore,
    request: (cursor) =>
      query(
        collection(db, DECK_COLLECTION),
        where("uid", "==", uid),
        orderBy("updatedAt"),
        ...(cursor ? [startAt(new Timestamp(cursor.seconds, cursor.nanoseconds))] : [])
      ),
    parse: (id, data) => {
      const document = parseDeckDocument(id, data);
      return document.deletedAt === null ? toDeck(id, document) : null;
    },
    receive: (result) => {
      const saved = applyDeckSnapshot(scope, result);
      onReady?.();
      return saved;
    },
    onError,
  });
}

export function createDeck(uid: string, deck: RemoteDeckCreateInput): Promise<void> {
  const input = createDeckSchema.parse({ uid, deck });
  const createdAt = Date.now();
  const document = toDeckDocument(input.uid, input.deck, createdAt);
  const reference = doc(db, DECK_COLLECTION, input.deck.id);
  void setDoc(reference, document).catch(() => undefined);
  return Promise.resolve();
}

export function editDeck(uid: string, deck: z.input<typeof deckEditSchema>): Promise<void> {
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
  void updateDoc(reference, document).catch(() => undefined);
  return Promise.resolve();
}

export function deleteDeck(uid: string, deckId: DeckId): Promise<void> {
  authenticatedUidSchema.parse(uid);
  const id = deckIdSchema.parse(deckId);
  // A parent tombstone hides all children, including Cards not yet present in this device's cache.
  // This keeps deletion atomic and offline-capable for decks of any size.
  const reference = doc(db, DECK_COLLECTION, id);
  const deletedAt = Date.now();
  void updateDoc(reference, { deletedAt, updatedAt: serverTimestamp() }).catch(() => undefined);
  return Promise.resolve();
}
