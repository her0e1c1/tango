import type { CardId } from "@/entities/card";
import { useAuthUid } from "@/entities/auth";
import { editStudyProgress } from "@/entities/study-progress";

export const useEditCardScore = () => {
  const uid = useAuthUid();

  return {
    updateScore: (cardId: CardId, score: number) => editStudyProgress(uid, { cardId, score }),
  };
};
