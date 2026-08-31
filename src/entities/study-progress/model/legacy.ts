import { DEFAULT_DIFFICULTY, clampDifficulty, type Difficulty } from "./difficulty";

/** Converts the former signed streak only at compatibility read boundaries. */
export const legacyScoreToDifficulty = (score: number): Difficulty => clampDifficulty(DEFAULT_DIFFICULTY - score);

/** Preserves the meaning of legacy score bounds while reversing their direction. */
export const legacyScoreBoundsToDifficultyBounds = (
  scoreMin: number | null,
  scoreMax: number | null
): { difficultyMin: Difficulty | null; difficultyMax: Difficulty | null } => ({
  difficultyMin: scoreMax === null ? null : legacyScoreToDifficulty(scoreMax),
  difficultyMax: scoreMin === null ? null : legacyScoreToDifficulty(scoreMin),
});
