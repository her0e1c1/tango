import type { DeckCreateInput, DeleteDeckInput, EditDeckInput } from "../model/types";

import { deleteLocalCardsByDeckId } from "@/entities/card/@x/deck";
import { createLocalDeck, deleteLocalDeck, editLocalDeck, findDeckById } from "../model/store";
import {
  createDeck as createRemoteDeck,
  deleteDeck as deleteRemoteDeck,
  editDeck as editRemoteDeck,
} from "./firestore";

export const createDeck = async (uid: string, deck: DeckCreateInput): Promise<void> => {
  if (deck.localMode === true) {
    createLocalDeck({ ...deck, localMode: true });
    return;
  }
  await createRemoteDeck(uid, deck);
};

export const editDeck = async (uid: string, deck: EditDeckInput["deck"]): Promise<void> => {
  if (findDeckById(deck.id)?.localMode === true) {
    editLocalDeck(deck);
    return;
  }
  await editRemoteDeck(uid, deck);
};

export const deleteDeck = async (uid: string, deck: DeleteDeckInput["deck"]): Promise<void> => {
  if (findDeckById(deck.id)?.localMode === true) {
    deleteLocalCardsByDeckId(deck.id);
    deleteLocalDeck(deck.id);
    return;
  }
  await deleteRemoteDeck(uid, deck);
};
