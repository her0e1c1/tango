import { z } from "zod";

import { firestoreTimestampDateSchema, parseFirestoreDocument } from "./firestoreDocument";

const cardDtoSchema = z.object({
  id: z.string().optional(),
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
  nextSeeingAt: firestoreTimestampDateSchema.optional(),
  interval: z.number().optional(),
  url: z.string().optional(),
  startLine: z.number().optional(),
  endLine: z.number().optional(),
});

const cardCreateDtoSchema = cardDtoSchema.required({ id: true });
const cardUpdateDtoSchema = cardDtoSchema
  .omit({ id: true, updatedAt: true })
  .partial()
  .extend({ updatedAt: z.number() });

type CardDto = z.infer<typeof cardDtoSchema>;

export const parseCardDto = (id: string, value: unknown): CardDto =>
  parseFirestoreDocument(cardDtoSchema, "card", id, value);

export const parseCardCreateDto = (id: string, value: unknown) =>
  parseFirestoreDocument(cardCreateDtoSchema, "card", id, value);

export const parseCardUpdateDto = (id: string, value: unknown) =>
  parseFirestoreDocument(cardUpdateDtoSchema, "card", id, value);
