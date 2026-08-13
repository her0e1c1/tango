import { createDeckSchema, type CreateDeckInput } from "@/entities/deck";

import { createDeckDocument } from "./firestore";

export const createDeck = async (uid: string, deck: CreateDeckInput["deck"]): Promise<void> => {
  const input = createDeckSchema.parse({ uid, deck });
  await createDeckDocument(input.deck);
};
