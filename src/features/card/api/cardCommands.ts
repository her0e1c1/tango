import type { Card, CardEdit, CardId } from "@/entities/card";
import type { DeckId } from "@/entities/deck";

import { createCardDocument, removeCardDocument, updateCardDocument } from "@/entities/card";
import { resourceKey, withResourceAccess } from "@/shared/lib/resourceAccess";
import { runSerially } from "@/shared/lib/runSerially";

const requireUid = (uid: string) => {
  if (uid === "") throw new Error("A confirmed user is required for remote Card writes");
};

const requireOwner = (uid: string, entityUid: string | undefined) => {
  if (entityUid != null && entityUid !== uid) {
    throw new Error("Card owner does not match the authenticated user");
  }
};

const withCardWriteAccess = <T>(uid: string, id: CardId, deckId: DeckId, task: () => Promise<T>): Promise<T> =>
  runSerially(resourceKey("card", uid, id), () =>
    withResourceAccess([resourceKey("deck-membership", uid, deckId)], "shared", task)
  );

export const cardCommands = {
  create: async (uid: string, card: Card): Promise<void> => {
    requireUid(uid);
    requireOwner(uid, card.uid);
    await withCardWriteAccess(uid, card.id, card.deckId, () => createCardDocument(card));
  },

  update: async (uid: string, card: CardEdit): Promise<void> => {
    requireUid(uid);
    requireOwner(uid, card.uid);
    await withCardWriteAccess(uid, card.id, card.deckId, () => updateCardDocument(card));
  },

  remove: async (uid: string, id: CardId, deckId: DeckId): Promise<void> => {
    requireUid(uid);
    await withCardWriteAccess(uid, id, deckId, () => removeCardDocument(id));
  },
};
