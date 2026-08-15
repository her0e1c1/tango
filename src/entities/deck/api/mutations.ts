import type { DeckCreateInput, DeckId, EditDeckInput, LocalDeckCreateInput } from "../model/types";

import { deleteLocalCardsByDeckId } from "@/entities/card/@x/deck";
import { createLocalDeck, deleteLocalDeck, editLocalDeck, findDeckById } from "../model/store";
import {
  createDeck as createRemoteDeck,
  deleteDeck as deleteRemoteDeck,
  editDeck as editRemoteDeck,
} from "./firestore";

const requireDeck = (id: DeckId) => {
  const deck = findDeckById(id);
  if (deck === undefined) throw new Error(`Deck "${id}" was not found`);
  return deck;
};

export const createDeck = async (uid: string, deck: DeckCreateInput | LocalDeckCreateInput): Promise<void> => {
  if (deck.localMode) {
    createLocalDeck({ ...deck, localMode: true });
    return;
  }
  await createRemoteDeck(uid, deck);
};

export const editDeck = async (uid: string, deck: EditDeckInput["deck"]): Promise<void> => {
  if (requireDeck(deck.id).localMode) {
    editLocalDeck(deck);
    return;
  }
  await editRemoteDeck(uid, deck);
};

export const deleteDeck = async (uid: string, deck: { id: DeckId }): Promise<void> => {
  const currentDeck = requireDeck(deck.id);
  if (currentDeck.localMode) {
    deleteLocalCardsByDeckId(deck.id);
    deleteLocalDeck(deck.id);
    return;
  }
  await deleteRemoteDeck(uid, { id: deck.id, uid: currentDeck.uid });
};
