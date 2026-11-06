import { calculateFsrsState } from "@/entities/card";
import { applyCardChanges, cardStore } from "@/entities/card/model/store";
export function seedCardFsrs(cardId: string, dueAt: number) {
  const fsrs = { ...calculateFsrsState(null, "good", 0), dueAt };
  const card = cardStore.getState().cardsById[cardId];
  if (card) applyCardChanges([{ ...card, fsrs }]);
  return fsrs;
}

export { calculateFsrsState } from "@/entities/card";
