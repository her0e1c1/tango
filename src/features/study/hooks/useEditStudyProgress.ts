import { editStudyProgress, type StudyProgressEdit } from "@/entities/study-progress";

import { useAuthUid } from "@/entities/auth";

export const useEditStudyProgress = () => {
  const uid = useAuthUid();
  const update = (progress: StudyProgressEdit) => editStudyProgress(uid, progress);

  return { update };
};
