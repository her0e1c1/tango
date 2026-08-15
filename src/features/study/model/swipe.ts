import { recordStudyProgress, resolveStudyRating } from "@/entities/study-progress";
import type { StudyProgress, StudyProgressEdit } from "@/entities/study-progress";
import type { SwipeAction, SwipeDirection, SwipeState } from "@/entities/preferences";

export const resolveSwipeAction = (controls: SwipeState, direction: SwipeDirection): SwipeAction => controls[direction];

export const buildStudyPatch = (progress: StudyProgress, swipeAction: SwipeAction, now: number): StudyProgressEdit =>
  recordStudyProgress(progress, resolveStudyRating(swipeAction), now);
