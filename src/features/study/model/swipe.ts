import { recordStudyProgress, type StudyProgressEdit, type StudyRating } from "@/entities/study-progress";
import type { StudyCard } from "./studyCard";
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

export const buildStudyPatch = (studyCard: StudyCard, swipeAction: SwipeAction, now: number): StudyProgressEdit =>
  recordStudyProgress(studyCard.progress, resolveStudyRating(swipeAction), now);
