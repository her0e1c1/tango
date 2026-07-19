import { uniq } from "lodash";

import { filterCardsForDeck as filterStudyCards } from "@/lib/study";
import type { RemoteById } from "@/query/cache/remoteCollection";

export const remoteValues = <T>(items: RemoteById<T>): T[] =>
  Object.values(items).filter((item): item is T => item != null);

export const cardsForDeck = (cards: Card[], deckId: DeckId): Card[] =>
  cards.filter((card) => card.deckId === deckId);

export const filteredCardsForDeck = (
  decksById: RemoteById<Deck>,
  cards: Card[],
  deckId: DeckId,
  config: ConfigState,
  now: number
): Card[] => {
  const deck = decksById[deckId];
  return deck == null ? [] : filterStudyCards(cardsForDeck(cards, deckId), deck, config, now);
};

export const tagsForDeck = (cards: Card[], deckId: DeckId): string[] =>
  uniq(cardsForDeck(cards, deckId).flatMap((card) => card.tags)).sort();
