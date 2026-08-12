import type { DeckId } from "@/entities/deck/@x/card";

import type { Card, CardEdit, CardId } from "../model/card";

import {
  create as createRemoteCard,
  logicalRemove as removeRemoteCard,
  update as updateRemoteCard,
  upsert as upsertRemoteCard,
} from "@/adapters/firestore/card";
import {
  cardMutationLock,
  deckMembershipMutationLock,
  withDeckMembershipLocks,
  withMutationLocks,
} from "@/store/remoteMutationLocks";
import { waitForRemoteWrite } from "@/shared/lib/remoteWrite";

const requireUid = (uid: string) => {
  if (uid === "") throw new Error("A confirmed user is required for remote Card writes");
};

const requireOwner = (uid: string, entityUid: string | undefined) => {
  if (entityUid != null && entityUid !== uid) {
    throw new Error("Card owner does not match the authenticated user");
  }
};

const withCardWriteLocks = <T>(uid: string, id: CardId, deckId: DeckId, task: () => Promise<T>): Promise<T> =>
  withMutationLocks([cardMutationLock(uid, id)], () =>
    withDeckMembershipLocks([deckMembershipMutationLock(uid, deckId)], "shared", task)
  );

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
    await withCardWriteLocks(uid, card.id, card.deckId, () =>
      waitForRemoteWrite(createRemoteCard(card), "Card creation")
    );
  },

  update: async (uid: string, card: CardEdit): Promise<void> => {
    requireUid(uid);
    requireOwner(uid, card.uid);
    await withCardWriteLocks(uid, card.id, card.deckId, () =>
      waitForRemoteWrite(updateRemoteCard(card), "Card update")
    );
  },

  remove: async (uid: string, id: CardId, deckId: DeckId): Promise<void> => {
    requireUid(uid);
    await withCardWriteLocks(uid, id, deckId, () => waitForRemoteWrite(removeRemoteCard(id), "Card deletion"));
  },

  bulkUpsert: async (uid: string, cards: Card[]): Promise<void> => {
    requireUid(uid);
    if (cards.some((card) => card.uid !== uid)) {
      throw new Error("Card owner does not match the authenticated user");
    }

    const results = await Promise.allSettled(
      cards.map((card) =>
        withCardWriteLocks(uid, card.id, card.deckId, () => waitForRemoteWrite(upsertRemoteCard(card), "Card import"))
      )
    );
    const failedIds = results.flatMap((result, index) => {
      const card = cards[index];
      return result.status === "rejected" && card != null ? [card.id] : [];
    });
    if (failedIds.length > 0) throw new CardBulkMutationError(failedIds, cards.length);
  },
};
