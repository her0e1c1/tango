import { calculateFsrsState } from "@/entities/card-study-state/model/rules";
import { cardStudyStateStore } from "@/entities/card-study-state/model/store";
export function seedCardStudyState(cardId: string, dueAt: number, uid = "user-id", deckId = "deck-id") {
  const state = {
    schemaVersion: 1 as const,
    cardId,
    uid,
    deckId,
    fsrs: { ...calculateFsrsState(null, "good", 0), dueAt },
    createdAt: 0,
    updatedAt: 0,
  };
  cardStudyStateStore.setState(({ states }) => ({ states: { ...states, [cardId]: state }, error: undefined }));
  return state;
}
export { calculateFsrsState } from "@/entities/card-study-state/model/rules";
