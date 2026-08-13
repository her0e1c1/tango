import type { DeckEdit } from "@/entities/deck";

import { updateDeckDocument } from "./firestore";

export const editDeck = async (uid: string, deck: DeckEdit): Promise<void> => {
  if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
  await updateDeckDocument(deck);
};
