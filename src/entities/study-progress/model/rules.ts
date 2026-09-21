import { clampDifficulty, type Difficulty } from "./difficulty";
import type { CardProgressFields, StudyRating } from "./types";

// Manual relative-difficulty edits remain independent from FSRS scheduling.
export const calculateDifficulty = (difficulty: Difficulty, rating: StudyRating): Difficulty =>
  clampDifficulty(difficulty + (rating === "again" ? 1 : -1));

// Builds the persistence patch for one interaction. Recall ratings are handled only by FSRS scheduling.
export const recordCardStudyProgress = (progress: CardProgressFields, studiedAt: number) => ({
  cardId: progress.id,
  difficulty: progress.difficulty,
  numberOfSeen: progress.numberOfSeen + 1,
  lastSeenAt: studiedAt,
});
