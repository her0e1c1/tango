import type { DeckCreateInput, DeckId, EditDeckInput } from "../model/types";

import { deleteLocalCardsByDeckId, moveLocalCardsToRemote } from "@/entities/card/@x/deck";
import { removeStudySession } from "@/entities/study-session/@x/deck";
import { authenticatedUidSchema, deckCreateSchema, deckEditSchema } from "../model/schema";
import { createLocalDeck, deleteLocalDeck, editLocalDeck, findDeckById } from "../model/store";
import {
  createDeck as createRemoteDeck,
  deleteDeck as deleteRemoteDeck,
  editDeck as editRemoteDeck,
} from "./firestore";

// Returns the current Deck store record or rejects a stale Deck reference.
const requireDeck = (id: DeckId) => {
  const deck = findDeckById(id);
  if (deck === undefined) throw new Error(`Deck "${id}" was not found`);
  return deck;
};

// Copies the parent Deck and its Cards before deleting local state, so any remote failure leaves a complete
// local source that can be retried instead of a partially migrated Deck.
const moveLocalDeckToRemote = async (
  uid: string,
  currentDeck: Extract<ReturnType<typeof requireDeck>, { localMode: true }>,
  edit: EditDeckInput["deck"]
): Promise<void> => {
  const userId = authenticatedUidSchema.parse(uid);
  const localDeck = editLocalDeck({ ...edit, id: currentDeck.id, localMode: true });
  const { createdAt: _createdAt, updatedAt: _updatedAt, localMode: _localMode, ...remoteValues } = localDeck;

  // Firestore rules require the parent Deck to exist before its Cards can be moved.
  await createRemoteDeck(userId, { ...remoteValues, localMode: false });
  await moveLocalCardsToRemote(userId, localDeck.id);
  deleteLocalDeck(localDeck.id);
};

// Routes a validated Deck creation command through its selected persistence mode.
export const createDeck = async (uid: string, deck: DeckCreateInput): Promise<void> => {
  const command = deckCreateSchema.parse(deck);
  if (command.localMode) {
    createLocalDeck({ ...command, localMode: true });
    return;
  }
  await createRemoteDeck(uid, command);
};

// Routes a Deck edit through the current store record and canonical domain transition.
export const editDeck = async (uid: string, deck: EditDeckInput["deck"]): Promise<void> => {
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
  await editRemoteDeck(uid, currentDeck, edit);
};

// Deletes a Deck by stable identity and clears its dependent resources and study session.
export const deleteDeck = async (uid: string, deckId: DeckId): Promise<void> => {
  const currentDeck = requireDeck(deckId);
  if (currentDeck.localMode) {
    deleteLocalCardsByDeckId(deckId);
    deleteLocalDeck(deckId);
  } else {
    await deleteRemoteDeck(uid, currentDeck);
  }

  // A deleted Deck must not leave a resumable session behind in persisted client state.
  removeStudySession(deckId);
};
