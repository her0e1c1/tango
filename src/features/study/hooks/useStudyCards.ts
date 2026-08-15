import { useMemo } from "react";

import type { Card } from "@/entities/card";
import { createStudyProgress, useStudyProgresses } from "@/entities/study-progress";
import { createStudyCard, type StudyCard } from "../model/studyCard";

export const useStudyCardItems = (cards: Card[]): StudyCard[] => {
  const progresses = useStudyProgresses();
  const progressesByCardId = useMemo(
    () => new Map(progresses.map((progress) => [progress.cardId, progress])),
    [progresses]
  );
  return useMemo(
    () => cards.map((card) => createStudyCard(card, progressesByCardId.get(card.id) ?? createStudyProgress(card.id))),
    [cards, progressesByCardId]
  );
};
