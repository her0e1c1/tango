import { doc, updateDoc } from "firebase/firestore";

import { getDb, getTimestamp } from "@/shared/firestore";

export const removeCardDocument = async (id: string): Promise<void> => {
  const updatedAt = getTimestamp();
  await updateDoc(doc(getDb(), "card", id), { updatedAt, deletedAt: updatedAt });
};
