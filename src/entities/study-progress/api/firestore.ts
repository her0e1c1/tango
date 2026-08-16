import type { EditStudyProgressInput } from "../model/types";

import { doc, updateDoc } from "firebase/firestore";

import { db } from "@/shared/firebase";
import { getCurrentTimeMillis } from "@/shared/lib/currentTime";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { editStudyProgressSchema } from "../model/schema";

export const editStudyProgress = async (uid: string, progress: EditStudyProgressInput["progress"]): Promise<void> => {
  const input = editStudyProgressSchema.parse({ uid, progress });
  const { cardId, ...fields } = input.progress;
  // StudyProgress is embedded in its Card document; patch only progress fields so Card content remains untouched.
  const document = omitUndefined({ ...fields, updatedAt: getCurrentTimeMillis() });
  await updateDoc(doc(db, "card", cardId), document);
};
