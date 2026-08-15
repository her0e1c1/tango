import { useMemo } from "react";

import type { Card } from "@/entities/card";
import { joinCardsWithStudyProgress, type StudyCard, useStudyProgresses } from "@/entities/study-progress";

export const useStudyCardItems = (cards: Card[]): StudyCard[] => {
  const progresses = useStudyProgresses();
  return useMemo(() => joinCardsWithStudyProgress(cards, progresses), [cards, progresses]);
};
