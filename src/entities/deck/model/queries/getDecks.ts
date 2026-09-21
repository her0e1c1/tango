import { deckStore } from "../store";
import type { Deck } from "../types";

export function getDecks(): Deck[] {
  const { remoteDecks } = deckStore.getState();
  return remoteDecks;
}
