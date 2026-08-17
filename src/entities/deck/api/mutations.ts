import type { DeckCreateInput, DeckId, EditDeckInput } from "../model/types";

import { deleteLocalCardsByDeckId } from "@/entities/card/@x/deck";
import { removeStudySession } from "@/entities/study-session/@x/deck";
import { deckCreateSchema } from "../model/schema";
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
  if (currentDeck.localMode) {
    editLocalDeck(deck);
    return;
  }
  await editRemoteDeck(uid, currentDeck, deck);
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
