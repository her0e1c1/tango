import { doc, updateDoc } from "firebase/firestore";

import { db } from "@/shared/firebase";
import { getTimestamp } from "@/shared/firestore";

export const removeCardDocument = async (id: string): Promise<void> => {
  const updatedAt = getTimestamp();
  await updateDoc(doc(db, "card", id), { updatedAt, deletedAt: updatedAt });
};
