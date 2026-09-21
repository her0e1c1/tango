import { mapStudyProgressPatch } from "./document";
import { doc, type WriteBatch } from "firebase/firestore";
import { db } from "@/shared/firebase";
import { studyProgressEditSchema } from "../model/schema";
import type { EditStudyProgressInput } from "../model/types";

export function writeStudyProgress(batch: WriteBatch, progress: EditStudyProgressInput["progress"], updatedAt: number) {
  const { cardId, ...fields } = studyProgressEditSchema.parse(progress);
  const reference = doc(db, "card", cardId);
  batch.update(reference, mapStudyProgressPatch(fields, updatedAt));
  return reference;
}
