import type { DeckId } from "@/entities/deck";

import { httpsCallable } from "firebase/functions";

import { functions } from "@/shared/firebase";

interface DeleteDeckResponse {
  status: "completed";
  deletedCards: number;
}

const requestDeckDeletion = httpsCallable<{ deckId: DeckId }, DeleteDeckResponse>(functions, "deleteDeck");

export const deleteDeck = async (deckId: DeckId): Promise<void> => {
  await requestDeckDeletion({ deckId });
};
