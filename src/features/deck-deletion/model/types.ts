import type { Deck } from "@/entities/deck";

export interface DeckDeletionTarget {
  deck: Deck;
  cardCount: number;
}
