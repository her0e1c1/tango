import type { StudyProgressEdit } from "@/entities/study-progress";

import { doc, updateDoc } from "firebase/firestore";

import { getDb, getTimestamp, omitUndefined, parseCardUpdateDto } from "@/shared/firestore";

export const editStudyProgress = async (uid: string, progress: StudyProgressEdit): Promise<void> => {
  if (uid === "") throw new Error("A confirmed user is required for remote StudyProgress writes");
  const { cardId, ...fields } = progress;
  const document = parseCardUpdateDto(cardId, omitUndefined({ ...fields, updatedAt: getTimestamp() }));
  await updateDoc(doc(getDb(), "card", cardId), document);
};
