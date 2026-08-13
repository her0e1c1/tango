import type { Card, CardId } from "@/entities/card";

import { runSerially } from "@/shared/lib/runSerially";
import { waitForRemoteWrite } from "@/shared/lib/remoteWrite";
import { upsertCardDocument } from "./cardFirestore";

export class CardBulkMutationError extends Error {
  constructor(
    public readonly failedIds: CardId[],
    total: number,
    options?: ErrorOptions
  ) {
    super(`${failedIds.length} of ${total} Card writes failed`, options);
  }
}

const cardMutationLock = (uid: string, id: CardId) => `card:${uid}:${id}`;

export const upsertImportedCards = async (uid: string, cards: Card[]): Promise<void> => {
  if (uid === "") throw new Error("A confirmed user is required for imports");
  if (cards.some((card) => card.uid !== uid)) {
    throw new Error("Card owner does not match the authenticated user");
  }

  const results = await Promise.allSettled(
    cards.map((card) =>
      runSerially(cardMutationLock(uid, card.id), () => waitForRemoteWrite(upsertCardDocument(card), "Card import"))
    )
  );
  const failedIds = results.flatMap((result, index) => {
    const card = cards[index];
    return result.status === "rejected" && card != null ? [card.id] : [];
  });
  if (failedIds.length > 0) throw new CardBulkMutationError(failedIds, cards.length);
};
