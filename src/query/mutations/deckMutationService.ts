/**
 * @file Coordinates remote mutation behavior for Deck Mutation Service.
 * It serializes conflicting writes and owns optimistic Deck removal rollback.
 */

import type { RemoteById } from "@/query/cache/remoteCollection";
import { cardMutationLock, deckMutationLock, withMutationLocks } from "@/query/mutations/locks";
import type { RemoteStore } from "@/store/remoteStore";

export interface DeckMutationServiceDependencies {
  store: Pick<RemoteStore, "read" | "replace">;
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
  /**
   * Reads the current user's identifier-indexed deck cache.
   * Mutation workflows take a fresh snapshot before applying optimistic changes or rollback logic.
   */
  const decks = (uid: string) => dependencies.store.read(uid, "decks");
  /**
   * Reads the current user's identifier-indexed card cache.
   * Mutation workflows take a fresh snapshot before applying optimistic changes or rollback logic.
   */
  const cards = (uid: string) => dependencies.store.read(uid, "cards");
  /**
   * Updates decks in the remote-data layer.
   * The function keeps validation, persistence, and related state changes in a single workflow.
   */
  const setDecks = (uid: string, next: RemoteById<Deck>) => dependencies.store.replace(uid, "decks", next);
  /**
   * Updates cards in the remote-data layer.
   * The function keeps validation, persistence, and related state changes in a single workflow.
   */
  const setCards = (uid: string, next: RemoteById<Card>) => dependencies.store.replace(uid, "cards", next);

  return {
    /** Persists a deck while holding its deck lock. */
    create: (_uid: string, deck: Deck) =>
      withMutationLocks([deckMutationLock(deck.id)], () => dependencies.createDeck(deck)),
    /** Persists a deck patch while holding its deck lock. */
    update: (_uid: string, patch: DeckEdit) =>
      withMutationLocks([deckMutationLock(patch.id)], () => dependencies.updateDeck(patch)),
    /**
     * Optimistically removes a deck and its cached child cards while holding all related locks.
     * If remote deletion fails, only entries that are still absent are restored so newer work is
     * not overwritten.
     */
    remove: (uid: string, id: DeckId) => {
      const childIds = Object.values(cards(uid))
        .filter((card): card is Card => card?.deckId === id)
        .map((card) => card.id);
      return withMutationLocks([deckMutationLock(id), ...childIds.map(cardMutationLock)], async () => {
        const previousDecks = decks(uid);
        const previousCards = cards(uid);
        const nextDecks = { ...previousDecks };
        const nextCards = { ...previousCards };
        delete nextDecks[id];
        childIds.forEach((cardId) => {
          delete nextCards[cardId];
        });
        setDecks(uid, nextDecks);
        setCards(uid, nextCards);
        try {
          await dependencies.removeDeck(id, uid);
        } catch (error) {
          const currentDecks = decks(uid);
          const currentCards = cards(uid);
          const rollbackDecks = { ...currentDecks };
          const rollbackCards = { ...currentCards };
          if (currentDecks[id] == null && previousDecks[id] != null) rollbackDecks[id] = previousDecks[id];
          childIds.forEach((cardId) => {
            if (currentCards[cardId] == null && previousCards[cardId] != null) {
              rollbackCards[cardId] = previousCards[cardId];
            }
          });
          setDecks(uid, rollbackDecks);
          setCards(uid, rollbackCards);
          throw error;
        }
      });
    },
  };
};
