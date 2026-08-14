import { createCardSchema, type CardCreateInput } from "@/entities/card";

import { createCardDocument } from "./firestore";

export const createCard = async (uid: string, card: CardCreateInput): Promise<void> => {
  const input = createCardSchema.parse({ uid, card });
  await createCardDocument(input.card);
};
