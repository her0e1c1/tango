import { getDecks } from "@/entities/deck/@x/card";
import { cardStore } from "../store";
import type { Card } from "../types";

export function getCards(): Card[] {
  const state = cardStore.getState();
  const decks = getDecks();
  return state.remoteCards.filter((card) => decks.some((deck) => deck.id === card.deckId && deck.uid === card.uid));
}
