import { recordStudyProgress, resolveStudyRating } from "@/entities/study-progress";
import type { StudyProgress, StudyProgressEdit } from "@/entities/study-progress";
import type { SwipeAction } from "@/entities/preferences";

export const buildStudyPatch = (progress: StudyProgress, swipeAction: SwipeAction, now: number): StudyProgressEdit =>
  recordStudyProgress(progress, resolveStudyRating(swipeAction), now);
