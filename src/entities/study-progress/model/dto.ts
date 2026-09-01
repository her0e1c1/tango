import type { StudyProgress, StudyProgressDocumentFields } from "./types";

/** Maps only StudyProgress-owned document fields into the Card-scoped learning history. */
export const mapStudyProgressDocument = (
  cardId: StudyProgress["cardId"],
  document: StudyProgressDocumentFields
): StudyProgress => {
  const progress: StudyProgress = {
    cardId,
    difficulty: document.difficulty,
    numberOfSeen: document.numberOfSeen,
  };
  if (document.lastSeenAt !== undefined) progress.lastSeenAt = document.lastSeenAt;
  if (document.nextSeeingAt !== undefined) progress.nextSeeingAt = document.nextSeeingAt;
  if (document.interval !== undefined) progress.interval = document.interval;
  return progress;
};
