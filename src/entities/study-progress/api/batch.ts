import { doc, type WriteBatch } from "firebase/firestore";
import { db } from "@/shared/firebase";
import { studyProgressEditSchema } from "../model/schema";
import type { StudyProgressEdit } from "../model/types";

export function writeStudyProgress(batch: WriteBatch, progress: StudyProgressEdit, updatedAt: number): void {
  const { cardId, ...fields } = studyProgressEditSchema.parse(progress);
  batch.update(doc(db, "card", cardId), { ...fields, updatedAt });
}
