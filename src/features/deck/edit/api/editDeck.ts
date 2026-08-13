import { editDeckSchema, type EditDeckInput } from "@/entities/deck";

import { updateDeckDocument } from "./firestore";

export const editDeck = async (uid: string, deck: EditDeckInput["deck"]): Promise<void> => {
  const input = editDeckSchema.parse({ uid, deck });
  await updateDeckDocument(input.deck);
};
