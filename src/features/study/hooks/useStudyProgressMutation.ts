import { useAuthUid } from "@/entities/auth";
import { editStudyProgress, type StudyProgressEdit } from "@/entities/study-progress";

export const useStudyProgressMutation = () => {
  const uid = useAuthUid();

  return {
    save: (progress: StudyProgressEdit) => editStudyProgress(uid, progress),
  };
};
