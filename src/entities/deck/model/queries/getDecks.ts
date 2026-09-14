import { deckStore } from "../store";
import type { Deck } from "../types";

export function getDecks(): Deck[] {
  const { remoteDecks, localDecks } = deckStore.getState();
  return [...remoteDecks, ...localDecks];
}
