import type { CardEdit } from "@/entities/card";

import { doc, updateDoc } from "firebase/firestore";

import { getDb, getTimestamp, omitUndefined, parseCardUpdateDto } from "@/shared/firestore";

export const updateCardDocument = async (card: CardEdit): Promise<void> => {
  const document = parseCardUpdateDto(card.id, omitUndefined({ ...card, id: undefined, updatedAt: getTimestamp() }));
  await updateDoc(doc(getDb(), "card", card.id), document);
};
