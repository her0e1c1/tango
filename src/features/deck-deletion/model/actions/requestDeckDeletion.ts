import { findCardsByDeckId } from "@/entities/card";
import { mustFindDeckById, type Deck } from "@/entities/deck";
import type { DeckDeletionTarget } from "../types";

export const requestDeckDeletion = (
  id: Deck["id"],
  {
    pending,
    setTarget,
  }: {
    pending: boolean;
    setTarget: (target: DeckDeletionTarget) => void;
  }
): void => {
  if (pending) return;
  const deck = mustFindDeckById(id);
  setTarget({ deck, cardCount: findCardsByDeckId(id).length });
};
