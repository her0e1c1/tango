/**
 * @file Coordinates remote mutation behavior for Card Mutation Service.
 * It applies optimistic cache changes, serializes conflicting work, and restores consistent state
 * when a request fails.
 */

import type { RemoteCache } from "@/query/cache/remoteCache";
import { toRemoteById, type RemoteById } from "@/query/cache/remoteCollection";
import { cardMutationLock, withMutationLocks } from "@/query/mutations/locks";
import { runOptimisticMutation } from "@/query/mutations/optimisticMutation";

export interface CardMutationServiceDependencies {
  cache: RemoteCache;
  createCard: (card: Card) => Promise<string>;
  updateCard: (card: CardEdit) => Promise<void>;
  removeCard: (id: CardId) => Promise<void>;
  upsertCard: (card: Card) => Promise<string>;
  readCards: (uid: string) => Promise<Card[]>;
}

/**
 * Represents the card bulk mutation error condition used by the remote-data layer.
 * The class keeps related error details or behavior together so callers can recognize and handle
 * this specific case.
 */
export class CardBulkMutationError extends Error {
  constructor(
    public readonly failedIds: CardId[],
    total: number
  ) {
    super(`${failedIds.length} of ${total} Card writes failed`);
  }
}

/**
 * Creates and configures a card mutation service.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
export const createCardMutationService = (dependencies: CardMutationServiceDependencies) => {
  /**
   * Reads the current user's identifier-indexed card cache.
   * Mutation workflows take a fresh snapshot before applying optimistic changes or rollback logic.
   */
  const cards = (uid: string) => dependencies.cache.read(uid, "cards");

  /**
   * Updates cards in the remote-data layer.
   * The function keeps validation, persistence, and related state changes in a single workflow.
   */
  const replaceCards = (uid: string, next: RemoteById<Card>) => {
    dependencies.cache.replace(uid, "cards", next);
  };

  /**
   * Runs one or more card writes with mutation locks and an optimistic cache update.
   * If the remote write fails, the shared optimistic-mutation helper restores only values that are
   * still current.
   */
  const optimistic = async <T>(
    uid: string,
    ids: CardId[],
    next: (previous: RemoteById<Card>) => RemoteById<Card>,
    write: () => Promise<T>
  ): Promise<T> =>
    withMutationLocks(ids.map(cardMutationLock), () =>
      runOptimisticMutation({
        targetIds: ids,
        read: () => cards(uid),
        replace: (cards) => replaceCards(uid, cards),
        update: next,
        mutation: write,
      })
    );

  return {
    /**
     * Adds a card to the user's cache immediately, then persists it while holding its card lock.
     * A failed write restores the previous cache entry unless newer work has replaced it.
     */
    create: (uid: string, card: Card) =>
      optimistic(
        uid,
        [card.id],
        (previous) => ({ ...previous, [card.id]: card }),
        () => dependencies.createCard(card)
      ),
    /**
     * Merges a card patch into the user's cache before persistence while holding its card lock.
     * The operation fails early when the target card is not present in the cache.
     */
    update: (uid: string, patch: CardEdit) =>
      optimistic(
        uid,
        [patch.id],
        (previous) => {
          const current = previous[patch.id];
          if (current == null) throw new Error(`Card ${patch.id} is not available`);
          return { ...previous, [patch.id]: { ...current, ...patch } };
        },
        () => dependencies.updateCard(patch)
      ),
    /**
     * Removes a card from the user's cache before the remote deletion completes.
     * The per-card lock serializes conflicting work and rollback restores a still-current value.
     */
    remove: (uid: string, id: CardId) =>
      optimistic(
        uid,
        [id],
        (previous) => {
          const next = { ...previous };
          delete next[id];
          return next;
        },
        () => dependencies.removeCard(id)
      ),
    /**
     * Optimistically inserts many cards while holding every affected card lock.
     * If any write fails, the method reloads authoritative cards and throws an error listing the
     * failed identifiers; otherwise it resolves without a value.
     */
    bulkUpsert: (uid: string, upserts: Card[]) =>
      withMutationLocks(
        upserts.map((card) => cardMutationLock(card.id)),
        async () => {
          const previous = cards(uid);
          replaceCards(uid, { ...previous, ...toRemoteById(upserts) });
          const results = await Promise.allSettled(upserts.map(dependencies.upsertCard));
          const failedIds = results.flatMap((result, index) => {
            const card = upserts[index];
            return result.status === "rejected" && card != null ? [card.id] : [];
          });
          if (failedIds.length === 0) return;

          const authoritative = await dependencies.readCards(uid);
          replaceCards(uid, toRemoteById(authoritative));
          throw new CardBulkMutationError(failedIds, upserts.length);
        }
      ),
  };
};
