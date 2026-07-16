import type { QueryClient } from "@tanstack/react-query";
import { isEqual } from "lodash";

import { firestoreKeys } from "@/query/firestoreKeys";
import type { RemoteById } from "@/query/remoteReadController";

export interface CardMutationServiceDependencies {
  client: QueryClient;
  createCard: (card: Card) => Promise<string>;
  updateCard: (card: CardEdit) => Promise<void>;
  removeCard: (id: CardId) => Promise<void>;
  upsertCard: (card: Card) => Promise<string>;
  readCards: (uid: string) => Promise<Card[]>;
}

const toById = (cards: Card[]): RemoteById<Card> => Object.fromEntries(cards.map((card) => [card.id, card]));

export const createCardMutationService = (dependencies: CardMutationServiceDependencies) => {
  const tails = new Map<CardId, Promise<void>>();

  const cards = (uid: string) => dependencies.client.getQueryData<RemoteById<Card>>(firestoreKeys.cards(uid)) ?? {};

  const replaceCards = (uid: string, next: RemoteById<Card>) => {
    dependencies.client.setQueryData(firestoreKeys.cards(uid), next);
  };

  const enqueue = async <T>(ids: CardId[], task: () => Promise<T>): Promise<T> => {
    const uniqueIds = [...new Set(ids)];
    const previous = uniqueIds.map((id) => tails.get(id)).filter((tail): tail is Promise<void> => tail != null);
    const operation = Promise.all(previous).then(task);
    const settled = operation.then(
      () => undefined,
      () => undefined
    );
    uniqueIds.forEach((id) => {
      tails.set(id, settled);
    });
    try {
      return await operation;
    } finally {
      uniqueIds.forEach((id) => {
        if (tails.get(id) === settled) tails.delete(id);
      });
    }
  };

  const optimistic = async <T>(
    uid: string,
    ids: CardId[],
    next: (previous: RemoteById<Card>) => RemoteById<Card>,
    write: () => Promise<T>
  ): Promise<T> =>
    enqueue(ids, async () => {
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
      enqueue(
        upserts.map((card) => card.id),
        async () => {
          const previous = cards(uid);
          replaceCards(uid, { ...previous, ...toById(upserts) });
          const results = await Promise.allSettled(upserts.map(dependencies.upsertCard));
          const failures = results.filter((result) => result.status === "rejected");
          if (failures.length === 0) return;

          const authoritative = await dependencies.readCards(uid);
          replaceCards(uid, toById(authoritative));
          throw new Error(`${failures.length} of ${upserts.length} Card writes failed`);
        }
      ),
  };
};
