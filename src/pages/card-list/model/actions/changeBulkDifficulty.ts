import { type Difficulty, MAX_DIFFICULTY, MIN_DIFFICULTY } from "@/entities/study-progress";
import { cardListStore } from "../store";

export function changeBulkDifficulty(difficulty: Difficulty | null): void {
  const { bulk } = cardListStore.getState();
  if (bulk == null || bulk.attempted) return;
  if (
    difficulty == null ||
    (Number.isInteger(difficulty) && difficulty >= MIN_DIFFICULTY && difficulty <= MAX_DIFFICULTY)
  )
    cardListStore.setState({ bulk: { ...bulk, difficulty } });
}
