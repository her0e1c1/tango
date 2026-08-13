import { deleteDeckSchema, type DeleteDeckInput } from "@/entities/deck";

import { deleteDeckDocuments } from "./firestore";

export const deleteDeck = async (uid: string, deck: DeleteDeckInput["deck"]): Promise<void> => {
  const input = deleteDeckSchema.parse({ uid, deck });
  await deleteDeckDocuments(input.uid, input.deck.id);
};
