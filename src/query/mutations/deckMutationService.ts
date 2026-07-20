/**
 * @file Coordinates remote mutation behavior for Deck Mutation Service.
 * It applies optimistic cache changes, serializes conflicting work, and restores consistent state
 * when a request fails.
 */

import type { RemoteCache } from "@/query/cache/remoteCache";
import type { RemoteById } from "@/query/cache/remoteCollection";
import { cardMutationLock, deckMutationLock, withMutationLocks } from "@/query/mutations/locks";
import { runOptimisticMutation } from "@/query/mutations/optimisticMutation";

export interface DeckMutationServiceDependencies {
  cache: RemoteCache;
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
  const decks = (uid: string) => dependencies.cache.read(uid, "decks");
  /**
   * Reads the current user's identifier-indexed card cache.
   * Mutation workflows take a fresh snapshot before applying optimistic changes or rollback logic.
   */
  const cards = (uid: string) => dependencies.cache.read(uid, "cards");
  /**
   * Updates decks in the remote-data layer.
   * The function keeps validation, persistence, and related state changes in a single workflow.
   */
  const setDecks = (uid: string, next: RemoteById<Deck>) => dependencies.cache.replace(uid, "decks", next);
  /**
   * Updates cards in the remote-data layer.
   * The function keeps validation, persistence, and related state changes in a single workflow.
   */
  const setCards = (uid: string, next: RemoteById<Card>) => dependencies.cache.replace(uid, "cards", next);
  /**
   * Runs a deck write while holding that deck's mutation lock and updating its cache
   * optimistically.
   * The shared rollback behavior protects newer cache changes when the remote write fails.
   */
  const optimisticDeck = <T>(
    uid: string,
    id: DeckId,
    update: (previous: RemoteById<Deck>) => RemoteById<Deck>,
    mutation: () => Promise<T>
  ) =>
    withMutationLocks([deckMutationLock(id)], () =>
      runOptimisticMutation({
        targetIds: [id],
        read: () => decks(uid),
        replace: (decks) => setDecks(uid, decks),
        update,
        mutation,
      })
    );

  return {
    /**
     * Adds a deck to the user's cache immediately, then persists it while holding its deck lock.
     * A failed write restores the previous cache entry unless newer work has replaced it.
     */
    create: (uid: string, deck: Deck) =>
      optimisticDeck(
        uid,
        deck.id,
        (previous) => ({ ...previous, [deck.id]: deck }),
        () => dependencies.createDeck(deck)
      ),
    /**
     * Merges a deck patch into the user's cache before persistence while holding its deck lock.
     * The operation fails early when the target deck is not present in the cache.
     */
    update: (uid: string, patch: DeckEdit) =>
      optimisticDeck(
        uid,
        patch.id,
        (previous) => {
          const current = previous[patch.id];
          if (current == null) throw new Error(`Deck ${patch.id} is not available`);
          return { ...previous, [patch.id]: { ...current, ...patch } };
        },
        () => dependencies.updateDeck(patch)
      ),
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
