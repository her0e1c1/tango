import { editLocalCardStudyProgress, findCardById } from "@/entities/card/@x/study-progress";
import { editLocalStudyProgress } from "../model/store";
import type { StudyProgressEdit } from "../model/types";
import { editRemoteStudyProgress } from "./firestore";

// Routes a progress edit to the persistence mode owned by its Card.
export const editStudyProgress = async (uid: string, progress: StudyProgressEdit): Promise<void> => {
  const card = findCardById(progress.cardId);
  if (card === undefined) throw new Error(`Card "${progress.cardId}" was not found`);

  if ("uid" in card) {
    await editRemoteStudyProgress(uid, progress);
    return;
  }

  const updatedProgress = editLocalStudyProgress(progress);
  const { cardId: id, ...fields } = updatedProgress;
  // Card consumers migrate in #604; keep their runtime view aligned without making Card persistence authoritative.
  editLocalCardStudyProgress({ id, ...fields });
};
