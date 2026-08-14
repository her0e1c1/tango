import type { CardCreateInput, CardEdit, CardId } from "@/entities/card";

interface ImportedCardWriters {
  createCard: (uid: string, card: CardCreateInput) => Promise<unknown>;
  editCard: (uid: string, card: CardEdit) => Promise<unknown>;
}

export class CardBulkMutationError extends Error {
  constructor(
    public readonly failedIds: CardId[],
    total: number,
    options?: ErrorOptions
  ) {
    super(`${failedIds.length} of ${total} Card writes failed`, options);
  }
}

export const upsertImportedCards = async (
  uid: string,
  cards: CardCreateInput[],
  createdIds: CardId[],
  { createCard, editCard }: ImportedCardWriters
): Promise<void> => {
  if (uid === "") throw new Error("A confirmed user is required for imports");
  if (cards.some((card) => card.uid !== uid)) {
    throw new Error("Card owner does not match the authenticated user");
  }

  const created = new Set(createdIds);
  const results = await Promise.allSettled(
    cards.map((card) => (created.has(card.id) ? createCard(uid, card) : editCard(uid, card)))
  );
  const failedIds = results.flatMap((result, index) => {
    const card = cards[index];
    return result.status === "rejected" && card != null ? [card.id] : [];
  });
  if (failedIds.length > 0) throw new CardBulkMutationError(failedIds, cards.length);
};
