import type { z } from "zod";
import type { DeckCreateInput, DeckId, DeckMigration } from "../model/types";

import { addCardCreatesToBatch, type CardCreateInput, deleteLocalCardsByDeckId } from "@/entities/card/@x/deck";
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/shared/firebase";
import { getCurrentTimeMillis } from "@/shared/lib/currentTime";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import {
  authenticatedUidSchema,
  createDeckSchema,
  type deckEditSchema,
  deckIdSchema,
  deckMigrationSchema,
  editDeckSchema,
} from "../model/schema";
import { deckStore, deleteLocalDeck, replaceRemoteDecks } from "../model/store";
import { parseDeckDocument, toDeck, toDeckDocument } from "./document";

const DECK_COLLECTION = "deck";
const CARD_COLLECTION = "card";
const MIGRATION_CARD_CHUNK_SIZE = 450;

// Parses an active remote Deck while omitting tombstoned documents.
const readActiveRemoteDeck = (id: DeckId, value: unknown) => {
  const document = parseDeckDocument(id, value);
  return document.deletedAt === null && document.migration?.state !== "copying" ? toDeck(id, document) : undefined;
};

// Subscribes the remote Deck store to active documents owned by one user.
export const subscribeDecks = (uid: string, onError: (error: Error) => void): (() => void) =>
  onSnapshot(
    query(collection(db, DECK_COLLECTION), where("uid", "==", uid)),
    (snapshot) => {
      try {
        const remoteDecks = snapshot.docs.flatMap((document) => {
          const deck = readActiveRemoteDeck(document.id, document.data());
          return deck === undefined ? [] : [deck];
        });
        const visibleDecks = remoteDecks.filter((deck) => {
          if (deck.migration === undefined) return true;
          const localDeck = deckStore.getState().localDecks.find(({ id }) => id === deck.id);
          return localDeck === undefined || deck.migration.revision >= localDeck.localRevision;
        });
        replaceRemoteDecks(visibleDecks);

        // A completed equal-or-newer revision proves the remote graph survived, so reload recovery can finish cleanup.
        for (const deck of visibleDecks) {
          if (deck.migration !== undefined) {
            const localDeck = deckStore.getState().localDecks.find(({ id }) => id === deck.id);
            if (localDeck !== undefined && deck.migration.revision >= localDeck.localRevision) {
              deleteLocalCardsByDeckId(deck.id);
              deleteLocalDeck(deck.id);
            }
          }
        }
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );

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

export interface DeckMigrationStart {
  migration: DeckMigration;
  complete: boolean;
}

// Registers the newest local revision transactionally; equal revisions resume one shared attempt.
export const beginDeckMigration = async (
  uid: string,
  deck: DeckCreateInput,
  migration: DeckMigration
): Promise<DeckMigrationStart> => {
  const input = createDeckSchema.parse({ uid, deck });
  const requestedMigration = deckMigrationSchema.parse(migration);
  const deckRef = doc(db, DECK_COLLECTION, input.deck.id);
  const createdAt = getCurrentTimeMillis();

  const start = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(deckRef);
    if (snapshot.exists()) {
      const currentDocument = parseDeckDocument(input.deck.id, snapshot.data());
      if (currentDocument.uid !== uid) throw new Error("Deck owner does not match the authenticated user");
      if (currentDocument.migration === undefined) throw new Error("A remote Deck already exists for this id");
      if (currentDocument.migration.revision > requestedMigration.revision) {
        throw new Error("A newer Deck migration already exists");
      }
      if (currentDocument.migration.revision === requestedMigration.revision) {
        return {
          migration: {
            id: currentDocument.migration.id,
            revision: currentDocument.migration.revision,
          },
          complete: currentDocument.migration.state === "complete",
        };
      }
    }

    transaction.set(deckRef, {
      ...toDeckDocument(input.deck, createdAt),
      migration: { ...requestedMigration, state: "copying" },
    });
    return { migration: requestedMigration, complete: false };
  });
  return start;
};

// Writes arbitrarily large Card snapshots in resumable chunks guarded by the active remote migration id.
export const writeDeckMigrationCards = async (
  uid: string,
  deckId: DeckId,
  migration: DeckMigration,
  cards: CardCreateInput[]
): Promise<void> => {
  authenticatedUidSchema.parse(uid);
  deckIdSchema.parse(deckId);
  const activeMigration = deckMigrationSchema.parse(migration);

  for (let offset = 0; offset < cards.length; offset += MIGRATION_CARD_CHUNK_SIZE) {
    const batch = writeBatch(db);
    addCardCreatesToBatch(batch, {
      uid,
      cards: cards.slice(offset, offset + MIGRATION_CARD_CHUNK_SIZE),
      createdAt: getCurrentTimeMillis(),
      migrationId: activeMigration.id,
    });
    // biome-ignore lint/performance/noAwaitInLoops: Sequential chunks bound Firestore request pressure for large Decks.
    await batch.commit();
  }
};

// Publishes the Deck only if no newer revision replaced this attempt while its Card chunks were writing.
export const finalizeDeckMigration = async (uid: string, deckId: DeckId, migration: DeckMigration): Promise<void> => {
  const userId = authenticatedUidSchema.parse(uid);
  const id = deckIdSchema.parse(deckId);
  const expectedMigration = deckMigrationSchema.parse(migration);
  const deckRef = doc(db, DECK_COLLECTION, id);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(deckRef);
    if (!snapshot.exists()) throw new Error("Remote Deck migration was not found");
    const document = parseDeckDocument(id, snapshot.data());
    if (document.uid !== userId) throw new Error("Deck owner does not match the authenticated user");
    if (document.migration?.id !== expectedMigration.id || document.migration.revision !== expectedMigration.revision) {
      throw new Error("Deck migration was replaced by a newer revision");
    }
    if (document.migration.state === "complete") return;
    transaction.update(deckRef, {
      migration: { ...expectedMigration, state: "complete" },
      updatedAt: getCurrentTimeMillis(),
    });
  });
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
