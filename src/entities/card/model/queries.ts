import { getDecks } from "@/entities/deck/@x/card";
import { filterCardsByDeckId } from "./rules";
import { cardIdSchema } from "./schema";
import { cardStore } from "./store";
import type { Card, CardId } from "./types";

export function getCards(): Card[] {
  const { remoteCards } = cardStore.getState();
  const decks = getDecks();
  return remoteCards.filter((card) => decks.some((deck) => deck.id === card.deckId && deck.uid === card.uid));
}

export const findCardById = (id: CardId): Card | undefined => {
  const cardId = cardIdSchema.parse(id);
  return getCards().find((card) => card.id === cardId);
};

// Returns the requested Card or throws when a caller's Card reference no longer resolves.
export const mustFindCardById = (id: CardId): Card => {
  const card = getCards().find((candidate) => candidate.id === id);

  if (card == null) throw new Error(`Card not found: ${id}`);

  return card;
};

export function findCardsByDeckId(deckId: string): Card[] {
  return filterCardsByDeckId(getCards(), deckId);
}

export function requireOwnedCard(uid: string, id: CardId) {
  const card = findCardById(id);
  if (card === undefined) throw new Error(`Card "${id}" was not found`);
  if (!uid || card.uid !== uid) throw new Error("Card owner does not match the authenticated user");
  return card;
}
