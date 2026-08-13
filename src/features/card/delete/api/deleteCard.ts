import { deleteCardSchema, type DeleteCardInput } from "@/entities/card";

import { removeCardDocument } from "./firestore";

export const deleteCard = async (uid: string, card: DeleteCardInput["card"]): Promise<void> => {
  const input = deleteCardSchema.parse({ uid, card });
  await removeCardDocument(input.card.id);
};
