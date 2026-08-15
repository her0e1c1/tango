import type { CardId, CardMutation } from "../model/types";

import { createCard, editCard } from "./firestore";

export class CardBulkMutationError extends Error {
  constructor(
    public readonly failedIds: CardId[],
    total: number,
    options?: ErrorOptions
  ) {
    super(`${failedIds.length} of ${total} Card writes failed`, options);
  }
}

export const mutateCards = async (uid: string, mutations: CardMutation[]): Promise<void> => {
  const results = await Promise.allSettled(
    mutations.map((mutation) =>
      mutation.kind === "create" ? createCard(uid, mutation.card) : editCard(uid, mutation.card)
    )
  );
  const failedIds = results.flatMap((result, index) => {
    const mutation = mutations[index];
    return result.status === "rejected" && mutation != null ? [mutation.card.id] : [];
  });
  if (failedIds.length > 0) throw new CardBulkMutationError(failedIds, mutations.length);
};
