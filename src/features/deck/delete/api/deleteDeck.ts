import type { Deck } from "@/entities/deck";

import { deleteDeckDocuments } from "./firestore";

export const deleteDeck = async (uid: string, deck: Deck): Promise<void> => {
  if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
  if (deck.uid !== uid) throw new Error("Deck owner does not match the authenticated user");
  await deleteDeckDocuments(uid, deck.id);
};
