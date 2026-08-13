import type { Card } from "@/entities/card";

import { doc, setDoc } from "firebase/firestore";
import { z } from "zod";

import { getDb, getTimestamp, omitUndefined } from "@/shared/firestore";

const cardDocumentSchema = z.object({
  id: z.string(),
  frontText: z.string(),
  backText: z.string(),
  tags: z.array(z.string()),
  uniqueKey: z.string(),
  deckId: z.string(),
  uid: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  score: z.number(),
  numberOfSeen: z.number(),
  lastSeenAt: z.number().optional(),
  nextSeeingAt: z.date().optional(),
  interval: z.number().optional(),
  url: z.string().optional(),
  startLine: z.number().optional(),
  endLine: z.number().optional(),
});

export const upsertCardDocument = async (card: Card): Promise<string> => {
  const updatedAt = getTimestamp();
  const createdAt = card.createdAt > 0 ? card.createdAt : updatedAt;
  const document = cardDocumentSchema.parse(
    omitUndefined({ ...card, createdAt, updatedAt, deletedAt: card.deletedAt ?? null })
  );
  await setDoc(doc(getDb(), "card", card.id), document);
  return card.id;
};
