import type { Card, CardEdit, CardId } from "@/entities/card";

import { createCardDocument, removeCardDocument, updateCardDocument } from "./firestore";

const requireUid = (uid: string) => {
  if (uid === "") throw new Error("A confirmed user is required for remote Card writes");
};

const requireOwner = (uid: string, entityUid: string | undefined) => {
  if (entityUid != null && entityUid !== uid) {
    throw new Error("Card owner does not match the authenticated user");
  }
};

export const cardCommands = {
  create: async (uid: string, card: Card): Promise<void> => {
    requireUid(uid);
    requireOwner(uid, card.uid);
    await createCardDocument(card);
  },

  update: async (uid: string, card: CardEdit): Promise<void> => {
    requireUid(uid);
    requireOwner(uid, card.uid);
    await updateCardDocument(card);
  },

  remove: async (uid: string, id: CardId): Promise<void> => {
    requireUid(uid);
    await removeCardDocument(id);
  },
};
