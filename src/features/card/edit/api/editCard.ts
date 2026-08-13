import { editCardSchema, type EditCardInput } from "@/entities/card";

import { updateCardDocument } from "./firestore";

export const editCard = async (uid: string, card: EditCardInput["card"]): Promise<void> => {
  const input = editCardSchema.parse({ uid, card });
  await updateCardDocument(input.card);
};
