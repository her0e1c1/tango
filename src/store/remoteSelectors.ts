/**
 * @file Provides pure selection helpers for remote store data.
 */

import { uniq } from "lodash";

import { filterCardsForDeck as filterStudyCards } from "@/lib/study";
import type { RemoteById } from "@/store/remoteStore";

/**
 * Returns the concrete values stored in an identifier-indexed remote collection.
 * Missing entries are filtered out so callers receive a normal list of usable items.
 */
export const remoteValues = <T>(items: RemoteById<T>): T[] =>
  Object.values(items).filter((item): item is T => item != null);

/**
 * Returns every card that belongs to the requested deck.
 * This basic selection is reused by tag, study, and filtered-card calculations.
 */
export const cardsForDeck = (cards: Card[], deckId: DeckId): Card[] => cards.filter((card) => card.deckId === deckId);

/**
 * Returns the requested deck's cards after applying score, tag, and study-schedule rules.
 * The function combines those rules in one place so every study entry point selects the same
 * cards.
 */
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

/**
 * Returns the sorted set of unique tags used by cards in the requested deck.
 * Filter controls use this list without needing to scan card data themselves.
 */
export const tagsForDeck = (cards: Card[], deckId: DeckId): string[] =>
  uniq(cardsForDeck(cards, deckId).flatMap((card) => card.tags)).sort();
