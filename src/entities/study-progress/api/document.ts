import { parseCardDocument } from "@/entities/card/@x/study-progress";
import type { StudyProgress } from "../model/types";

export const mapStudyProgressDocument = (cardId: string, value: unknown): StudyProgress => {
  const document = parseCardDocument(cardId, value);
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
