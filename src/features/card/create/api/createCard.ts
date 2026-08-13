import type { Card } from "@/entities/card";

import { createCardDocument } from "./firestore";

export const createCard = async (uid: string, card: Card): Promise<void> => {
  if (uid === "") throw new Error("A confirmed user is required for remote Card writes");
  if (card.uid !== uid) throw new Error("Card owner does not match the authenticated user");
  await createCardDocument(card);
};
