/** @file Coordinates serialized remote Card mutations. */

import { cardMutationLock, withMutationLocks } from "@/query/mutations/locks";

export interface CardMutationServiceDependencies {
  createCard: (card: Card) => Promise<string>;
  updateCard: (card: CardEdit) => Promise<void>;
  removeCard: (id: CardId) => Promise<void>;
  upsertCard: (card: Card) => Promise<string>;
}

/**
 * Represents the card bulk mutation error condition used by the remote-data layer.
 * The class keeps related error details or behavior together so callers can recognize and handle
 * this specific case.
 */
export class CardBulkMutationError extends Error {
  constructor(
    public readonly failedIds: CardId[],
    total: number,
    options?: ErrorOptions
  ) {
    super(`${failedIds.length} of ${total} Card writes failed`, options);
  }
}

/**
 * Creates and configures a card mutation service.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
export const createCardMutationService = (dependencies: CardMutationServiceDependencies) => {
  return {
    /** Persists a card while holding its card lock. */
    create: (uid: string, card: Card) =>
      withMutationLocks([cardMutationLock(uid, card.id)], () => dependencies.createCard(card)),
    /** Persists a card patch while holding its card lock. */
    update: (uid: string, patch: CardEdit) =>
      withMutationLocks([cardMutationLock(uid, patch.id)], () => dependencies.updateCard(patch)),
    /** Logically removes a card while holding its card lock. */
    remove: (uid: string, id: CardId) =>
      withMutationLocks([cardMutationLock(uid, id)], () => dependencies.removeCard(id)),
    /** Writes many cards under their locks and reports every failed Card ID. */
    bulkUpsert: (uid: string, upserts: Card[]) =>
      withMutationLocks(
        upserts.map((card) => cardMutationLock(uid, card.id)),
        async () => {
          const results = await Promise.allSettled(upserts.map((card) => dependencies.upsertCard(card)));
          const failedIds = results.flatMap((result, index) => {
            const card = upserts[index];
            return result.status === "rejected" && card != null ? [card.id] : [];
          });
          if (failedIds.length === 0) return;
          throw new CardBulkMutationError(failedIds, upserts.length);
        }
      ),
  };
};
