import { createDeckSchema, type DeckCreateInput } from "@/entities/deck";

import { createDeckDocument } from "./firestore";

export const createDeck = async (uid: string, deck: DeckCreateInput): Promise<void> => {
  const input = createDeckSchema.parse({ uid, deck });
  await createDeckDocument(input.deck);
};
