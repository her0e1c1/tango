import { calculateFsrsState } from "@/entities/card";
import { cardStore } from "@/entities/card/model/store";
export function seedCardFsrs(cardId: string, dueAt: number) {
  const fsrs = { ...calculateFsrsState(null, "good", 0), dueAt };
  cardStore.setState(({ cardsById }) => ({
    cardsById: Object.fromEntries(
      Object.values(cardsById).map((card) => [card.id, card.id === cardId ? { ...card, fsrs } : card])
    ),
  }));
  return fsrs;
}

export { calculateFsrsState } from "@/entities/card";
