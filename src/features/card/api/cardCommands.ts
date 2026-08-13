import type { Card, CardEdit, CardId } from "@/entities/card";

import { runSerially } from "@/shared/lib/runSerially";
import { createCardDocument, removeCardDocument, updateCardDocument } from "./firestore";

const requireUid = (uid: string) => {
  if (uid === "") throw new Error("A confirmed user is required for remote Card writes");
};

const requireOwner = (uid: string, entityUid: string | undefined) => {
  if (entityUid != null && entityUid !== uid) {
    throw new Error("Card owner does not match the authenticated user");
  }
};

const cardMutationLock = (uid: string, id: CardId) => `card:${uid}:${id}`;

const serializeCardWrite = <T>(uid: string, id: CardId, task: () => Promise<T>): Promise<T> =>
  runSerially(cardMutationLock(uid, id), task);

export const cardCommands = {
  create: async (uid: string, card: Card): Promise<void> => {
    requireUid(uid);
    requireOwner(uid, card.uid);
    await serializeCardWrite(uid, card.id, () => createCardDocument(card));
  },

  update: async (uid: string, card: CardEdit): Promise<void> => {
    requireUid(uid);
    requireOwner(uid, card.uid);
    await serializeCardWrite(uid, card.id, () => updateCardDocument(card));
  },

  remove: async (uid: string, id: CardId): Promise<void> => {
    requireUid(uid);
    await serializeCardWrite(uid, id, () => removeCardDocument(id));
  },
};
