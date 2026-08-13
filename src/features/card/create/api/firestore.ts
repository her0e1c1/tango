import type { Card } from "@/entities/card";

import { collection, doc, setDoc } from "firebase/firestore";
import { z } from "zod";

import { getDb, getTimestamp, omitUndefined } from "@/shared/firestore";

const cardCreateSchema = z.object({
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

export const generateCardId = (): string => doc(collection(getDb(), "card")).id;

export const createCardDocument = async (card: Card): Promise<string> => {
  const createdAt = getTimestamp();
  const document = cardCreateSchema.parse(omitUndefined({ ...card, createdAt, updatedAt: createdAt, deletedAt: null }));
  await setDoc(doc(getDb(), "card", card.id), document);
  return card.id;
};
