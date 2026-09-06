import type { DeckDeletionTarget } from "../types";

export const getDeckDeletionTarget = (target: DeckDeletionTarget | undefined) =>
  target == null ? undefined : { deckName: target.deck.name, cardCount: target.cardCount };
