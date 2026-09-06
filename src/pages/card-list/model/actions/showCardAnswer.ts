import { type Card, type CardId, mustFindCardById } from "@/entities/card";

export const showCardAnswer = (cards: readonly Card[], id: CardId, setShownCard: (card: Card) => void): void => {
  setShownCard(mustFindCardById(cards, id));
};
