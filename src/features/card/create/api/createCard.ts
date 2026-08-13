import { createCardSchema, type CreateCardInput } from "@/entities/card";

import { createCardDocument } from "./firestore";

export const createCard = async (uid: string, card: CreateCardInput["card"]): Promise<void> => {
  const input = createCardSchema.parse({ uid, card });
  await createCardDocument(input.card);
};
