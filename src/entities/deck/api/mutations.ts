import type { z } from "zod";
import type { Deck, DeckId, LocalDeckCreateInput, RemoteDeckCreateInput } from "../model/types";

import { deleteLocalCardsByDeckId, moveLocalCardsToRemote } from "@/entities/card/@x/deck";
import { removeStudySession } from "@/entities/study-session/@x/deck";
import { createLocalDeck, deleteLocalDeck, editLocalDeck, findDeckById } from "../model/store";
import { authenticatedUidSchema, deckEditSchema } from "../model/schema";
import {
  createDeck as createRemoteDeck,
  deleteDeck as deleteRemoteDeck,
  editDeck as editRemoteDeck,
} from "./firestore";

// Returns the current Deck or rejects a stale Deck reference.
const requireDeck = (id: DeckId) => {
  const deck = findDeckById(id);
  if (deck === undefined) throw new Error(`Deck "${id}" was not found`);
  return deck;
};

// Remote writes must be authorized from current Entity state before reaching Firestore.
const requireOwnedRemoteDeck = (uid: string, deck: Deck): Extract<Deck, { localMode: false }> => {
  const userId = authenticatedUidSchema.parse(uid);
  if (deck.localMode) throw new Error("A local Deck cannot be used for a remote write");
  if (deck.uid !== userId) throw new Error("Deck owner does not match the authenticated user");
  return deck;
};

const moveLocalDeckToRemote = async (
  uid: string,
  currentDeck: Extract<ReturnType<typeof requireDeck>, { localMode: true }>,
  edit: z.infer<typeof deckEditSchema>
): Promise<void> => {
  const userId = authenticatedUidSchema.parse(uid);
  const localDeck = editLocalDeck({ ...edit, id: currentDeck.id, localMode: true });
  const { createdAt: _createdAt, updatedAt: _updatedAt, localMode: _localMode, ...remoteValues } = localDeck;
  const remoteDeck = {
    ...remoteValues,
    localMode: false as const,
  } satisfies RemoteDeckCreateInput;

  // Firestore rules require the parent Deck to exist before its Cards can be created.
  await createRemoteDeck(userId, remoteDeck);
  await moveLocalCardsToRemote(userId, localDeck.id);
  deleteLocalDeck(localDeck.id);
};

// Routes a Deck create through the payload's persistence mode.
export const createDeck = async (uid: string, deck: RemoteDeckCreateInput | LocalDeckCreateInput): Promise<void> => {
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
  const ownedDeck = requireOwnedRemoteDeck(uid, currentDeck);
  await editRemoteDeck(ownedDeck.uid, edit);
};

// Deletes a Deck and its owned local or remote resources before clearing its study session.
export const deleteDeck = async (uid: string, deckId: DeckId): Promise<void> => {
  const currentDeck = requireDeck(deckId);
  if (currentDeck.localMode) {
    deleteLocalCardsByDeckId(deckId);
    deleteLocalDeck(deckId);
  } else {
    const ownedDeck = requireOwnedRemoteDeck(uid, currentDeck);
    await deleteRemoteDeck(ownedDeck.uid, deckId);
  }

  // A deleted Deck must not leave a resumable session behind in persisted client state.
  removeStudySession(deckId);
};
