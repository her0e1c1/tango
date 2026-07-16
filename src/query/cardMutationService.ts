import type { QueryClient } from "@tanstack/react-query";
import { isEqual } from "lodash";

import { firestoreKeys } from "@/query/firestoreKeys";
import type { RemoteById } from "@/query/remoteReadController";
import { cardMutationLock, withMutationLocks } from "@/query/mutationLocks";

export interface CardMutationServiceDependencies {
  client: QueryClient;
  createCard: (card: Card) => Promise<string>;
  updateCard: (card: CardEdit) => Promise<void>;
  removeCard: (id: CardId) => Promise<void>;
  upsertCard: (card: Card) => Promise<string>;
  readCards: (uid: string) => Promise<Card[]>;
}

export class CardBulkMutationError extends Error {
  constructor(
    public readonly failedIds: CardId[],
    total: number
  ) {
    super(`${failedIds.length} of ${total} Card writes failed`);
  }
}

const toById = (cards: Card[]): RemoteById<Card> => Object.fromEntries(cards.map((card) => [card.id, card]));

export const createCardMutationService = (dependencies: CardMutationServiceDependencies) => {
  const cards = (uid: string) => dependencies.client.getQueryData<RemoteById<Card>>(firestoreKeys.cards(uid)) ?? {};

  const replaceCards = (uid: string, next: RemoteById<Card>) => {
    dependencies.client.setQueryData(firestoreKeys.cards(uid), next);
  };

  const optimistic = async <T>(
    uid: string,
    ids: CardId[],
    next: (previous: RemoteById<Card>) => RemoteById<Card>,
    write: () => Promise<T>
  ): Promise<T> =>
    withMutationLocks(ids.map(cardMutationLock), async () => {
      const previous = cards(uid);
      const optimisticCards = next(previous);
      replaceCards(uid, optimisticCards);
      try {
        return await write();
      } catch (error) {
        const current = cards(uid);
        const rollback = { ...current };
        ids.forEach((id) => {
          const optimisticCard = optimisticCards[id];
          if (!isEqual(current[id], optimisticCard)) return;
          const previousCard = previous[id];
          if (previousCard == null) delete rollback[id];
          else rollback[id] = previousCard;
        });
        replaceCards(uid, rollback);
        throw error;
      }
    });

  return {
    create: (uid: string, card: Card) =>
      optimistic(
        uid,
        [card.id],
        (previous) => ({ ...previous, [card.id]: card }),
        () => dependencies.createCard(card)
      ),
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
    bulkUpsert: (uid: string, upserts: Card[]) =>
      withMutationLocks(
        upserts.map((card) => cardMutationLock(card.id)),
        async () => {
          const previous = cards(uid);
          replaceCards(uid, { ...previous, ...toById(upserts) });
          const results = await Promise.allSettled(upserts.map(dependencies.upsertCard));
          const failedIds = results.flatMap((result, index) => {
            const card = upserts[index];
            return result.status === "rejected" && card != null ? [card.id] : [];
          });
          if (failedIds.length === 0) return;

          const authoritative = await dependencies.readCards(uid);
          replaceCards(uid, toById(authoritative));
          throw new CardBulkMutationError(failedIds, upserts.length);
        }
      ),
  };
};
