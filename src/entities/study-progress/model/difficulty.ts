import { z } from "zod";

export type Difficulty = number;

export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 10;
export const DEFAULT_DIFFICULTY = 5;

/** Shared validation for every new public difficulty input. */
export const difficultySchema = z.number().min(MIN_DIFFICULTY).max(MAX_DIFFICULTY);

/** Keeps calculated and legacy-adapted values inside the public difficulty contract. */
export const clampDifficulty = (difficulty: number): Difficulty =>
  Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, difficulty));
