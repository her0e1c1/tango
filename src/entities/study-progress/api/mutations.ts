import { editLocalCardStudyProgress, findCardById } from "@/entities/card/@x/study-progress";
import type { StudyProgressEdit } from "../model/types";
import { editRemoteStudyProgress } from "./firestore";

// Routes progress through the Card's persistence mode so session movement can still wait for a durable save.
export const editStudyProgress = async (uid: string, progress: StudyProgressEdit): Promise<void> => {
  const card = findCardById(progress.cardId);
  if (card === undefined) throw new Error(`Card "${progress.cardId}" was not found`);

  if ("uid" in card) {
    await editRemoteStudyProgress(uid, progress);
    return;
  }

  const { cardId: id, ...fields } = progress;
  editLocalCardStudyProgress({ id, ...fields });
};
