import type { StudyProgressEdit } from "../model/studyProgress";

import { doc, updateDoc } from "firebase/firestore";

import { getDb, getTimestamp } from "@/shared/firestore";
import { buildStudyProgressUpdateDto } from "./firestoreDocument";

export const update = async (progress: StudyProgressEdit): Promise<void> => {
  await updateDoc(doc(getDb(), "card", progress.cardId), buildStudyProgressUpdateDto(progress, getTimestamp()));
};
