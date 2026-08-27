import { editLocalCardStudyProgress, findCardById } from "@/entities/card/@x/study-progress";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { studyProgressEditSchema } from "../model/schema";
import type { StudyProgressEdit } from "../model/types";
import { editRemoteStudyProgress } from "./firestore";

// Routes progress through the Card's persistence mode so session movement can still wait for a durable save.
export const editStudyProgress = async (uid: string, progress: StudyProgressEdit): Promise<void> => {
  const edit = studyProgressEditSchema.parse(progress);
  const card = findCardById(edit.cardId);
  if (card === undefined) throw new Error(`Card "${edit.cardId}" was not found`);

  if ("uid" in card) {
    await editRemoteStudyProgress(uid, edit);
    return;
  }

  const { cardId: id, ...fields } = edit;
  editLocalCardStudyProgress(omitUndefined({ id, ...fields }));
};
