import type { DeckCreateInput, DeckId, EditDeckInput, LocalDeckCreateInput } from "../model/types";

import { deleteLocalCardsByDeckId } from "@/entities/card/@x/deck";
import { removeStudySession } from "@/entities/study-session/@x/deck";
import { createLocalDeck, deleteLocalDeck, editLocalDeck, findDeckById } from "../model/store";
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

// Routes a Deck create through the payload's persistence mode.
export const createDeck = async (uid: string, deck: DeckCreateInput | LocalDeckCreateInput): Promise<void> => {
  if (deck.localMode) {
    createLocalDeck({ ...deck, localMode: true });
    return;
  }
  await createRemoteDeck(uid, deck);
};

// Routes a Deck edit through the stored Deck's persistence mode.
export const editDeck = async (uid: string, deck: EditDeckInput["deck"]): Promise<void> => {
  if (requireDeck(deck.id).localMode) {
    editLocalDeck(deck);
    return;
  }
  await editRemoteDeck(uid, deck);
};

// Deletes a Deck and its owned local or remote resources before clearing its study session.
export const deleteDeck = async (uid: string, deck: { id: DeckId }): Promise<void> => {
  const currentDeck = requireDeck(deck.id);
  if (currentDeck.localMode) {
    deleteLocalCardsByDeckId(deck.id);
    deleteLocalDeck(deck.id);
  } else {
    await deleteRemoteDeck(uid, { id: deck.id, uid: currentDeck.uid });
  }

  // A deleted Deck must not leave a resumable session behind in persisted client state.
  removeStudySession(deck.id);
};
