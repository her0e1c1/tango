import type { CardEdit } from "@/entities/card";
import { recordStudyProgress, type StudyRating } from "@/entities/study-progress";
import { createCardProgressEdit, type StudyCard } from "@/features/study/model/studyCard";
import type { SwipeAction, SwipeDirection, SwipeState } from "@/shared/config";

export const resolveSwipeAction = (controls: SwipeState, direction: SwipeDirection): SwipeAction => {
  return controls[direction];
};

const resolveStudyRating = (swipeAction: SwipeAction): StudyRating => {
  if (swipeAction === "GoToNextCardMastered") return "mastered";
  if (swipeAction === "GoToNextCardNotMastered" || swipeAction === "GoToNextCardToggleMastered") {
    return "not-mastered";
  }
  return "unrated";
};

export const buildStudyPatch = (studyCard: StudyCard, swipeAction: SwipeAction, now: number): CardEdit => {
  const progress = recordStudyProgress(studyCard.progress, resolveStudyRating(swipeAction), now);
  return createCardProgressEdit(studyCard.card.deckId, progress);
};
