import { calculateFsrsState } from "@/entities/card/model/fsrsRules";
import { cardStore } from "@/entities/card/model/store";
export function seedCardFsrs(cardId: string, dueAt: number) {
  const fsrs = { ...calculateFsrsState(null, "good", 0), dueAt };
  cardStore.setState(({ remoteCards }) => ({
    remoteCards: remoteCards.map((card) => (card.id === cardId ? { ...card, fsrs } : card)),
  }));
  return fsrs;
}

export { calculateFsrsState, classifyFsrsState } from "@/entities/card/model/fsrsRules";

export { isDeckTagSelectionMatching } from "@/entities/deck";
