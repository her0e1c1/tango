/**
 * @file Coordinates remote mutation behavior for Card Mutation Service.
 * It serializes conflicting writes and restores authoritative state after partial bulk failures.
 */

import { toRemoteById, type RemoteById } from "@/query/cache/remoteCollection";
import { cardMutationLock, withMutationLocks } from "@/query/mutations/locks";
import type { RemoteStore } from "@/store/remoteStore";

export interface CardMutationServiceDependencies {
  store: Pick<RemoteStore, "read" | "replace">;
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
   * Updates cards in the remote-data layer.
   * The function keeps validation, persistence, and related state changes in a single workflow.
   */
  const replaceCards = (uid: string, next: RemoteById<Card>) => {
    dependencies.store.replace(uid, "cards", next);
  };

  return {
    /** Persists a card while holding its card lock. */
    create: (_uid: string, card: Card) =>
      withMutationLocks([cardMutationLock(card.id)], () => dependencies.createCard(card)),
    /** Persists a card patch while holding its card lock. */
    update: (_uid: string, patch: CardEdit) =>
      withMutationLocks([cardMutationLock(patch.id)], () => dependencies.updateCard(patch)),
    /** Logically removes a card while holding its card lock. */
    remove: (_uid: string, id: CardId) => withMutationLocks([cardMutationLock(id)], () => dependencies.removeCard(id)),
    /**
     * Writes many cards under their locks, then resynchronizes from Firestore after partial failure.
     */
    bulkUpsert: (uid: string, upserts: Card[]) =>
      withMutationLocks(
        upserts.map((card) => cardMutationLock(card.id)),
        async () => {
          const results = await Promise.allSettled(upserts.map((card) => dependencies.upsertCard(card)));
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
