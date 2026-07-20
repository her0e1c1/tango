/** @file Coordinates serialized remote Deck mutations. */

import { deckMutationLock, withMutationLocks } from "@/query/mutations/locks";

export interface DeckMutationServiceDependencies {
  createDeck: (deck: Deck) => Promise<string>;
  updateDeck: (deck: DeckEdit) => Promise<void>;
  removeDeck: (deckId: DeckId, uid: string) => Promise<void>;
}

/**
 * Creates and configures a deck mutation service.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
export const createDeckMutationService = (dependencies: DeckMutationServiceDependencies) => {
  return {
    /** Persists a deck while holding its deck lock. */
    create: (uid: string, deck: Deck) =>
      withMutationLocks([deckMutationLock(uid, deck.id)], () => dependencies.createDeck(deck)),
    /** Persists a deck patch while holding its deck lock. */
    update: (uid: string, patch: DeckEdit) =>
      withMutationLocks([deckMutationLock(uid, patch.id)], () => dependencies.updateDeck(patch)),
    /** Removes a deck while holding its UID-scoped Deck lock. */
    remove: (uid: string, id: DeckId) =>
      withMutationLocks([deckMutationLock(uid, id)], () => dependencies.removeDeck(id, uid)),
  };
};
