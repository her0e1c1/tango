/**
 * @file Provides pure selection helpers for remote store data.
 */
import type { DeckId } from "@/entities/deck";
import type { Card } from "@/entities/card";

import * as lodash from "lodash";

import { selectCardsForDeck } from "@/entities/card";
import type { RemoteById } from "@/shared/lib/remote";

/**
 * Returns the concrete values stored in an identifier-indexed remote collection.
 * Missing entries are filtered out so callers receive a normal list of usable items.
 */
export const remoteValues = <T extends { id: string }>(items: RemoteById<T>): T[] =>
  Object.values(items).filter((item): item is T => item != null);

/**
 * Returns every card that belongs to the requested deck.
 * This basic selection is reused by tag, study, and filtered-card calculations.
 */
export const cardsForDeck = selectCardsForDeck;

/**
 * Returns the requested deck's cards after applying score, tag, and study-schedule rules.
 * The function combines those rules in one place so every study entry point selects the same
 * cards.
 */
/**
 * Returns the sorted set of unique tags used by cards in the requested deck.
 * Filter controls use this list without needing to scan card data themselves.
 */
export const tagsForDeck = (cards: Card[], deckId: DeckId): string[] =>
  lodash.uniq(cardsForDeck(cards, deckId).flatMap((card) => card.tags)).sort();
