import type { Card, CardEdit } from "@/entities/card";

import { doc, setDoc, updateDoc } from "firebase/firestore";
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

const cardUpdateSchema = cardCreateSchema.omit({ id: true }).partial().extend({ updatedAt: z.number() });

const createDto = (card: Card, createdAt: number) =>
  cardCreateSchema.parse(omitUndefined({ ...card, createdAt, updatedAt: createdAt, deletedAt: null }));

const updateDto = (card: CardEdit, updatedAt: number) =>
  cardUpdateSchema.parse(omitUndefined({ ...card, id: undefined, updatedAt }));

export const createCardDocument = async (card: Card): Promise<string> => {
  const createdAt = getTimestamp();
  await setDoc(doc(getDb(), "card", card.id), createDto(card, createdAt));
  return card.id;
};

export const updateCardDocument = async (card: CardEdit): Promise<void> => {
  await updateDoc(doc(getDb(), "card", card.id), updateDto(card, getTimestamp()));
};

export const removeCardDocument = async (id: string): Promise<void> => {
  const updatedAt = getTimestamp();
  await updateDoc(doc(getDb(), "card", id), { updatedAt, deletedAt: updatedAt });
};
