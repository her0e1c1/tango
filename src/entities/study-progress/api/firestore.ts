import type { EditStudyProgressInput } from "../model/types";

import { doc, updateDoc } from "firebase/firestore";

import { writeLocally } from "@/shared/firestore-write";
import { db } from "@/shared/firebase";
import { mapStudyProgressPatch } from "./document";
import { editStudyProgressSchema } from "../model/schema";

// Validates and writes StudyProgress-owned fields into the shared Card document.
export const editRemoteStudyProgress = async (
  uid: string,
  progress: EditStudyProgressInput["progress"]
): Promise<void> => {
  const input = editStudyProgressSchema.parse({ uid, progress });
  const { cardId, ...fields } = input.progress;
  // StudyProgress is embedded in its Card document; patch only progress fields so Card content remains untouched.
  const document = mapStudyProgressPatch(fields, Date.now());
  const reference = doc(db, "card", cardId);
  await writeLocally(uid, [reference], () => updateDoc(reference, document));
};
