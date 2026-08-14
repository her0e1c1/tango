import type { CardEdit } from "@/entities/card";

import { doc, updateDoc } from "firebase/firestore";

import { db } from "@/shared/firebase";
import { getTimestamp, omitUndefined } from "@/shared/firestore";

export const updateCardDocument = async (card: Omit<CardEdit, "uid">): Promise<void> => {
  const document = omitUndefined({ ...card, id: undefined, updatedAt: getTimestamp() });
  await updateDoc(doc(db, "card", card.id), document);
};
