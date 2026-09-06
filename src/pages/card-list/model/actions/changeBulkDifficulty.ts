import { type Difficulty, MAX_DIFFICULTY, MIN_DIFFICULTY } from "@/entities/study-progress";

export const changeBulkDifficulty = (
  difficulty: Difficulty | null,
  setDifficulty: (difficulty: Difficulty | null) => void
): void => {
  if (
    difficulty == null ||
    (Number.isInteger(difficulty) && difficulty >= MIN_DIFFICULTY && difficulty <= MAX_DIFFICULTY)
  )
    setDifficulty(difficulty);
};
