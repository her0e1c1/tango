import type { EditStudyProgressInput } from "../model/types";

import { doc, updateDoc } from "firebase/firestore";

import { db } from "@/shared/firebase";
import { getTimestamp, omitUndefined } from "@/shared/api";
import { editStudyProgressSchema } from "../model/schema";

export const editStudyProgress = async (uid: string, progress: EditStudyProgressInput["progress"]): Promise<void> => {
  const input = editStudyProgressSchema.parse({ uid, progress });
  const { cardId, ...fields } = input.progress;
  const document = omitUndefined({ ...fields, updatedAt: getTimestamp() });
  await updateDoc(doc(db, "card", cardId), document);
};
