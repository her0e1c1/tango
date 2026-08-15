import { editStudyProgressSchema, type EditStudyProgressInput } from "@/entities/study-progress";

import { doc, updateDoc } from "firebase/firestore";

import { db } from "@/shared/api";

export const editStudyProgress = async (uid: string, progress: EditStudyProgressInput["progress"]): Promise<void> => {
  const input = editStudyProgressSchema.parse({ uid, progress });
  const { cardId, ...fields } = input.progress;
  const document = { ...fields, updatedAt: Date.now() };
  await updateDoc(doc(db, "card", cardId), document);
};
