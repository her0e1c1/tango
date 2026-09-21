import { clampDifficulty, type Difficulty } from "./difficulty";
import type { CardProgressFields, StudyRating } from "./types";

// Keep the existing binary difficulty rule, not FSRS scheduling; Hard/Good/Easy all indicate successful recall.
export const calculateDifficulty = (difficulty: Difficulty, rating: StudyRating | undefined): Difficulty => {
  if (rating === undefined) return difficulty;
  return clampDifficulty(difficulty + (rating === "again" ? 1 : -1));
};

// Builds the persistence patch for one interaction, which always increments the seen count and records its timestamp.
export const recordCardStudyProgress = (
  progress: CardProgressFields,
  rating: StudyRating | undefined,
  studiedAt: number
) => ({
  cardId: progress.id,
  difficulty: calculateDifficulty(progress.difficulty, rating),
  numberOfSeen: progress.numberOfSeen + 1,
  lastSeenAt: studiedAt,
});
