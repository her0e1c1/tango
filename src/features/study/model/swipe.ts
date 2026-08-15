import { recordStudyProgress, type StudyRating } from "@/entities/study-progress";
import type { StudyProgress, StudyProgressEdit } from "@/entities/study-progress";
import type { SwipeAction, SwipeDirection, SwipeState } from "@/entities/preferences";

export const resolveSwipeAction = (controls: SwipeState, direction: SwipeDirection): SwipeAction => controls[direction];

const resolveStudyRating = (swipeAction: SwipeAction): StudyRating => {
  if (swipeAction === "GoToNextCardMastered") return "mastered";
  if (swipeAction === "GoToNextCardNotMastered" || swipeAction === "GoToNextCardToggleMastered") {
    return "not-mastered";
  }
  return "unrated";
};

export const buildStudyPatch = (progress: StudyProgress, swipeAction: SwipeAction, now: number): StudyProgressEdit =>
  recordStudyProgress(progress, resolveStudyRating(swipeAction), now);
