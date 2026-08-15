import type { CardCreateInput, DeleteCardInput, EditCardInput } from "../model/types";

import { findDeckById } from "@/entities/deck/@x/card";
import { createLocalCard, deleteLocalCard, editLocalCard, findCardById } from "../model/store";
import {
  createCard as createRemoteCard,
  deleteCard as deleteRemoteCard,
  editCard as editRemoteCard,
} from "./firestore";

const isLocalDeck = (deckId: string): boolean => findDeckById(deckId)?.localMode === true;

export const createCard = async (uid: string, card: CardCreateInput): Promise<void> => {
  if (isLocalDeck(card.deckId)) {
    createLocalCard(card);
    return;
  }
  await createRemoteCard(uid, card);
};

export const editCard = async (uid: string, card: EditCardInput["card"]): Promise<void> => {
  const currentCard = findCardById(card.id);
  if (currentCard !== undefined && isLocalDeck(currentCard.deckId)) {
    editLocalCard(card);
    return;
  }
  await editRemoteCard(uid, card);
};

export const deleteCard = async (uid: string, card: DeleteCardInput["card"]): Promise<void> => {
  const currentCard = findCardById(card.id);
  if (currentCard !== undefined && isLocalDeck(currentCard.deckId)) {
    deleteLocalCard(card.id);
    return;
  }
  await deleteRemoteCard(uid, card);
};
