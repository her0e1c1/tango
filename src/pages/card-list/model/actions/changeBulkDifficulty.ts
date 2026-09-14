import { type Difficulty, MAX_DIFFICULTY, MIN_DIFFICULTY } from "@/entities/study-progress";
import type { CardListStore } from "../store";

export function changeBulkDifficulty(store: CardListStore, difficulty: Difficulty | null): void {
  if (store.getState().bulkAttempted) return;
  if (
    difficulty == null ||
    (Number.isInteger(difficulty) && difficulty >= MIN_DIFFICULTY && difficulty <= MAX_DIFFICULTY)
  )
    store.setState({ bulkDifficulty: difficulty });
}
