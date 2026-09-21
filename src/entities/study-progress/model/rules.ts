import type { CardProgressFields } from "./types";

// Builds the persistence patch for one interaction. Recall ratings are handled only by FSRS scheduling.
export const recordCardStudyProgress = (progress: CardProgressFields, studiedAt: number) => ({
  cardId: progress.id,
  difficulty: progress.difficulty,
  numberOfSeen: progress.numberOfSeen + 1,
  lastSeenAt: studiedAt,
});
