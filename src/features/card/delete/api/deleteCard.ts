import type { CardId } from "@/entities/card";

import { removeCardDocument } from "./firestore";

export const deleteCard = async (uid: string, id: CardId): Promise<void> => {
  if (uid === "") throw new Error("A confirmed user is required for remote Card writes");
  await removeCardDocument(id);
};
