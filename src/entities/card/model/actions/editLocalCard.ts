import { localCardEditSchema, localCardSchema } from "../schema";
import type { LocalCard, LocalCardEdit } from "../types";
import { cardStore } from "../store";

// Applies a validated partial edit to an existing local Card.
export const editLocalCard = (input: LocalCardEdit): LocalCard => {
  const edit = localCardEditSchema.parse(input);
  const { localCards } = cardStore.getState();
  const currentCard = localCards.find(({ id }) => id === edit.id);
  if (currentCard === undefined) throw new Error(`Local Card "${edit.id}" was not found`);

  const updatedCard = localCardSchema.parse({ ...currentCard, ...edit, updatedAt: Date.now() });
  cardStore.setState({ localCards: localCards.map((card) => (card.id === updatedCard.id ? updatedCard : card)) });
  return updatedCard;
};
