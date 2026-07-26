import {
  create as createRemoteCard,
  logicalRemove as removeRemoteCard,
  update as updateRemoteCard,
  upsert as upsertRemoteCard,
} from "@/adapters/firestore/card";
import { cardMutationLock, withMutationLocks } from "@/store/remoteMutationLocks";

const requireUid = (uid: string) => {
  if (uid === "") throw new Error("A confirmed user is required for remote Card writes");
};

const requireOwner = (uid: string, entityUid: string | undefined) => {
  if (entityUid != null && entityUid !== uid) {
    throw new Error("Card owner does not match the authenticated user");
  }
};

export class CardBulkMutationError extends Error {
  constructor(
    public readonly failedIds: CardId[],
    total: number,
    options?: ErrorOptions
  ) {
    super(`${failedIds.length} of ${total} Card writes failed`, options);
  }
}

export const cardCommands = {
  create: async (uid: string, card: Card): Promise<void> => {
    requireUid(uid);
    requireOwner(uid, card.uid);
    await withMutationLocks([cardMutationLock(uid, card.id)], () => createRemoteCard(card));
  },

  update: async (uid: string, card: CardEdit): Promise<void> => {
    requireUid(uid);
    requireOwner(uid, card.uid);
    await withMutationLocks([cardMutationLock(uid, card.id)], () => updateRemoteCard(card));
  },

  remove: async (uid: string, id: CardId): Promise<void> => {
    requireUid(uid);
    await withMutationLocks([cardMutationLock(uid, id)], () => removeRemoteCard(id));
  },

  bulkUpsert: async (uid: string, cards: Card[]): Promise<void> => {
    requireUid(uid);
    if (cards.some((card) => card.uid !== uid)) {
      throw new Error("Card owner does not match the authenticated user");
    }

    const results = await Promise.allSettled(
      cards.map((card) => withMutationLocks([cardMutationLock(uid, card.id)], () => upsertRemoteCard(card)))
    );
    const failedIds = results.flatMap((result, index) => {
      const card = cards[index];
      return result.status === "rejected" && card != null ? [card.id] : [];
    });
    if (failedIds.length > 0) throw new CardBulkMutationError(failedIds, cards.length);
  },
};
