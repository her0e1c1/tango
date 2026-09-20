import { editLocalCardStudyProgress, findCardById } from "@/entities/card/@x/study-progress";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { studyProgressEditSchema } from "../model/schema";
import type { EditStudyProgressInput } from "../model/types";
import { editRemoteStudyProgress } from "./firestore";

// Routes manual difficulty edits through the Card's persistence mode.
export const editStudyProgress = async (uid: string, progress: EditStudyProgressInput["progress"]): Promise<void> => {
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
