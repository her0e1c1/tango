import type { Card, CardId } from "@/entities/card";

import { upsertCardDocument } from "@/entities/card";
import { resourceKey, withResourceAccess } from "@/shared/lib/resourceAccess";
import { runSerially } from "@/shared/lib/runSerially";
import { waitForRemoteWrite } from "@/shared/lib/remoteWrite";

export class CardBulkMutationError extends Error {
  constructor(
    public readonly failedIds: CardId[],
    total: number,
    options?: ErrorOptions
  ) {
    super(`${failedIds.length} of ${total} Card writes failed`, options);
  }
}

export const upsertImportedCards = async (uid: string, cards: Card[]): Promise<void> => {
  if (uid === "") throw new Error("A confirmed user is required for imports");
  if (cards.some((card) => card.uid !== uid)) {
    throw new Error("Card owner does not match the authenticated user");
  }

  const results = await Promise.allSettled(
    cards.map((card) =>
      runSerially(resourceKey("card", uid, card.id), () =>
        withResourceAccess([resourceKey("deck-membership", uid, card.deckId)], "shared", () =>
          waitForRemoteWrite(upsertCardDocument(card), "Card import")
        )
      )
    )
  );
  const failedIds = results.flatMap((result, index) => {
    const card = cards[index];
    return result.status === "rejected" && card != null ? [card.id] : [];
  });
  if (failedIds.length > 0) throw new CardBulkMutationError(failedIds, cards.length);
};
