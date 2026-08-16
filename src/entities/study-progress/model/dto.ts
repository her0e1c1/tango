import type { StudyProgress, StudyProgressDocumentFields } from "./types";

export const mapStudyProgressDocument = (
  cardId: StudyProgress["cardId"],
  document: StudyProgressDocumentFields
): StudyProgress => {
  const progress: StudyProgress = {
    cardId,
    score: document.score,
    numberOfSeen: document.numberOfSeen,
  };
  if (document.lastSeenAt !== undefined) progress.lastSeenAt = document.lastSeenAt;
  if (document.nextSeeingAt !== undefined) progress.nextSeeingAt = document.nextSeeingAt;
  if (document.interval !== undefined) progress.interval = document.interval;
  return progress;
};
