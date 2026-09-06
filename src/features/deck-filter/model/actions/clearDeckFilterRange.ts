import { MAX_DIFFICULTY, MIN_DIFFICULTY } from "@/entities/study-progress";
import type { UpdateDeckFilterOptions } from "../types";
import { updateDeckFilterDraft } from "./updateDeckFilterDraft";

export const clearDeckFilterRange = (options: UpdateDeckFilterOptions): void => {
  updateDeckFilterDraft({ difficultyMax: MAX_DIFFICULTY, difficultyMin: MIN_DIFFICULTY }, options);
};
