import type { StudyProgress, StudyProgressEdit, StudyProgressFilter, StudyRating } from "./types";

const calculateScore = (score: number, rating: StudyRating): number => {
  if (rating === "mastered") return score >= 0 ? score + 1 : 0;
  if (rating === "not-mastered") return score <= 0 ? score - 1 : 0;
  return score;
};

export const recordStudyProgress = (
  progress: StudyProgress,
  rating: StudyRating,
  studiedAt: number
): StudyProgressEdit => ({
  cardId: progress.cardId,
  score: calculateScore(progress.score, rating),
  numberOfSeen: progress.numberOfSeen + 1,
  lastSeenAt: studiedAt,
});

export const isStudyProgressEligible = (progress: StudyProgress, filter: StudyProgressFilter, now: number): boolean => {
  if (filter.maximumScore != null && progress.score > filter.maximumScore) return false;
  if (filter.minimumScore != null && progress.score < filter.minimumScore) return false;
  if (filter.respectNextSeeingAt && progress.nextSeeingAt != null && progress.nextSeeingAt.getTime() > now) {
    return false;
  }
  return true;
};

export const compareStudyProgress = (first: StudyProgress, second: StudyProgress): number =>
  first.numberOfSeen - second.numberOfSeen;

export const getNextStudyAvailabilityAt = (progresses: StudyProgress[], now: number): number | undefined => {
  let next: number | undefined;
  for (const progress of progresses) {
    const candidate = progress.nextSeeingAt?.getTime();
    if (candidate === undefined || candidate <= now || (next !== undefined && candidate >= next)) continue;
    next = candidate;
  }
  return next;
};
