import type { CardCreateInput, CardId, DeleteCardInput, EditCardInput } from "../model/types";

import { findDeckById } from "@/entities/deck/@x/card";
import { createLocalCard, deleteLocalCard, editLocalCard, findCardById } from "../model/store";
import {
  createCard as createRemoteCard,
  deleteCard as deleteRemoteCard,
  editCard as editRemoteCard,
} from "./firestore";

const isLocalDeck = (deckId: string): boolean => findDeckById(deckId)?.localMode === true;

const requireCard = (id: CardId) => {
  const card = findCardById(id);
  if (card === undefined) throw new Error(`Card "${id}" was not found`);
  return card;
};

const requireLocalMode = (deckId: string): boolean => {
  const deck = findDeckById(deckId);
  if (deck === undefined) throw new Error(`Deck "${deckId}" was not found`);
  return deck.localMode;
};

export const createCard = async (uid: string, card: CardCreateInput): Promise<void> => {
  if (isLocalDeck(card.deckId)) {
    createLocalCard(card);
    return;
  }
  await createRemoteCard(uid, card);
};

export const editCard = async (uid: string, card: EditCardInput["card"]): Promise<void> => {
  const currentCard = requireCard(card.id);
  if (requireLocalMode(currentCard.deckId)) {
    editLocalCard(card);
    return;
  }
  await editRemoteCard(uid, card);
};

export const deleteCard = async (uid: string, card: DeleteCardInput["card"]): Promise<void> => {
  const currentCard = requireCard(card.id);
  if (requireLocalMode(currentCard.deckId)) {
    deleteLocalCard(card.id);
    return;
  }
  await deleteRemoteCard(uid, card);
};
