import type { DeckDeletionTarget } from "../types";

export const getDeckDeletionTarget = (target: DeckDeletionTarget | undefined) =>
  target == null ? undefined : { deckId: target.deck.id, deckName: target.deck.name, cardCount: target.cardCount };
