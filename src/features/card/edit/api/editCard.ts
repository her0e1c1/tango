import type { CardEdit } from "@/entities/card";

import { updateCardDocument } from "./firestore";

export const editCard = async (uid: string, card: CardEdit): Promise<void> => {
  if (uid === "") throw new Error("A confirmed user is required for remote Card writes");
  if (card.uid != null && card.uid !== uid) throw new Error("Card owner does not match the authenticated user");
  await updateCardDocument(card);
};
