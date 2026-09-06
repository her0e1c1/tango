import { filterCardsByDeckId, type Card } from "@/entities/card";
import { mustFindDeckById, type Deck } from "@/entities/deck";
import type { DeckDeletionTarget } from "../types";

export const requestDeckDeletion = (
  id: Deck["id"],
  {
    pending,
    decks,
    cards,
    setTarget,
  }: {
    pending: boolean;
    decks: Deck[];
    cards: Card[];
    setTarget: (target: DeckDeletionTarget) => void;
  }
): void => {
  if (pending) return;
  const deck = mustFindDeckById(decks, id);
  setTarget({ deck, cardCount: filterCardsByDeckId(cards, id).length });
};
