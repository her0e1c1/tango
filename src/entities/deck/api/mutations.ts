import type { z } from "zod";
import type { DeckCreateInput, DeckId, LocalDeckCreateInput } from "../model/types";

import { type CardCreateInput, deleteLocalCardsByDeckId, getLocalCardsByDeckId } from "@/entities/card/@x/deck";
import { removeStudySession } from "@/entities/study-session/@x/deck";
import { generateId } from "@/shared/lib/generateId";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import {
  createLocalDeck,
  deckStore,
  deleteLocalDeck,
  editLocalDeck,
  findDeckById,
  setLocalDeckMigration,
} from "../model/store";
import { authenticatedUidSchema, deckEditSchema } from "../model/schema";
import {
  beginDeckMigration,
  createDeck as createRemoteDeck,
  deleteDeck as deleteRemoteDeck,
  editDeck as editRemoteDeck,
  finalizeDeckMigration,
  writeDeckMigrationCards,
} from "./firestore";

// Returns the current Deck or rejects a stale Deck reference.
const requireDeck = (id: DeckId) => {
  const deck = findDeckById(id);
  if (deck === undefined) throw new Error(`Deck "${id}" was not found`);
  return deck;
};

const createMigrationFingerprint = async (deck: DeckCreateInput, cards: CardCreateInput[]): Promise<string> => {
  // Include ordered outbound values so only the exact graph can resume or authorize local cleanup across tabs.
  const snapshot = new TextEncoder().encode(JSON.stringify({ deck, cards }));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", snapshot);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const moveLocalDeckToRemote = async (
  uid: string,
  currentDeck: Extract<ReturnType<typeof requireDeck>, { localMode: true }>,
  edit: z.infer<typeof deckEditSchema>
): Promise<void> => {
  const userId = authenticatedUidSchema.parse(uid);
  const localDeck = editLocalDeck({ ...edit, id: currentDeck.id, localMode: true });
  const {
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    localMode: _localMode,
    localRevision: _localRevision,
    migration: _migration,
    url: _currentUrl,
    ...currentValues
  } = localDeck;
  const remoteDeck = {
    ...currentValues,
    ...omitUndefined(localDeck.url === undefined ? {} : { url: localDeck.url }),
    uid: userId,
    localMode: false as const,
  } satisfies DeckCreateInput;
  const localCards = getLocalCardsByDeckId(localDeck.id);
  const remoteCards = localCards.map(({ createdAt: _cardCreatedAt, updatedAt: _cardUpdatedAt, ...card }) => ({
    ...card,
    uid: userId,
  }));
  const fingerprint = await createMigrationFingerprint(remoteDeck, remoteCards);
  const requestedMigration =
    localDeck.migration?.fingerprint === fingerprint
      ? localDeck.migration
      : { id: generateId(), revision: localDeck.localRevision, fingerprint };
  let migrationDeck =
    localDeck.migration === requestedMigration ? localDeck : setLocalDeckMigration(localDeck.id, requestedMigration);

  const start = await beginDeckMigration(userId, remoteDeck, requestedMigration);
  if (start.migration.id !== requestedMigration.id) {
    migrationDeck = setLocalDeckMigration(migrationDeck.id, start.migration);
  }
  if (!start.complete) {
    await writeDeckMigrationCards(userId, migrationDeck.id, start.migration, remoteCards);
    await finalizeDeckMigration(userId, migrationDeck.id, start.migration);
  }

  const latestLocalDeck = deckStore.getState().localDecks.find(({ id }) => id === migrationDeck.id);
  const latestLocalCards = getLocalCardsByDeckId(migrationDeck.id);
  if (latestLocalDeck === undefined && latestLocalCards.length === 0) return;

  // The persisted marker and immutable Card objects prove local data still matches the finalized remote revision.
  const cardsUnchanged =
    latestLocalCards.length === localCards.length &&
    latestLocalCards.every((card, index) => card === localCards[index]);
  if (
    latestLocalDeck?.migration?.id !== start.migration.id ||
    latestLocalDeck.migration.revision !== start.migration.revision ||
    latestLocalDeck.migration.fingerprint !== start.migration.fingerprint ||
    !cardsUnchanged
  ) {
    throw new Error(
      "The local Deck or its Cards changed while moving to Firestore. Save again to migrate the latest data"
    );
  }

  deleteLocalCardsByDeckId(migrationDeck.id);
  deleteLocalDeck(migrationDeck.id);
};

// Routes a Deck create through the payload's persistence mode.
export const createDeck = async (uid: string, deck: DeckCreateInput | LocalDeckCreateInput): Promise<void> => {
  if (deck.localMode) {
    createLocalDeck(deck);
    return;
  }
  await createRemoteDeck(uid, deck);
};

// Routes an edit through the stored mode or performs the supported one-way local-to-remote move.
export const editDeck = async (uid: string, deck: z.input<typeof deckEditSchema>): Promise<void> => {
  const currentDeck = requireDeck(deck.id);
  const edit = deckEditSchema.parse(deck);
  if (currentDeck.localMode) {
    if (edit.localMode === false) {
      await moveLocalDeckToRemote(uid, currentDeck, edit);
      return;
    }
    editLocalDeck(edit);
    return;
  }
  if (edit.localMode === true) throw new Error("A remote Deck cannot be moved to local storage");
  await editRemoteDeck(uid, edit);
};

// Deletes a Deck and its owned local or remote resources before clearing its study session.
export const deleteDeck = async (uid: string, deckId: DeckId): Promise<void> => {
  const currentDeck = requireDeck(deckId);
  if (currentDeck.localMode) {
    deleteLocalCardsByDeckId(deckId);
    deleteLocalDeck(deckId);
  } else {
    const userId = authenticatedUidSchema.parse(uid);
    if (currentDeck.uid !== userId) throw new Error("Deck owner does not match the authenticated user");
    await deleteRemoteDeck(userId, deckId);
  }

  // A deleted Deck must not leave a resumable session behind in persisted client state.
  removeStudySession(deckId);
};
