import type { CardEdit } from "@/entities/card";

import { doc, updateDoc } from "firebase/firestore";
import { z } from "zod";

import { getDb, getTimestamp, omitUndefined } from "@/shared/firestore";

const cardUpdateSchema = z
  .object({
    frontText: z.string(),
    backText: z.string(),
    tags: z.array(z.string()),
    uniqueKey: z.string(),
    deckId: z.string(),
    uid: z.string(),
    createdAt: z.number(),
    deletedAt: z.number().nullable(),
    score: z.number(),
    numberOfSeen: z.number(),
    lastSeenAt: z.number(),
    nextSeeingAt: z.date(),
    interval: z.number(),
    url: z.string(),
    startLine: z.number(),
    endLine: z.number(),
  })
  .partial()
  .extend({ updatedAt: z.number() });

export const updateCardDocument = async (card: CardEdit): Promise<void> => {
  const document = cardUpdateSchema.parse(omitUndefined({ ...card, id: undefined, updatedAt: getTimestamp() }));
  await updateDoc(doc(getDb(), "card", card.id), document);
};
