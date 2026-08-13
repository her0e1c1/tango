import type { Card, CardEdit, CardId } from "../model/card";
import type { StudyProgress } from "@/entities/study-progress/@x/card";

import { z } from "zod";

import { firestoreTimestampDateSchema, parseFirestoreDocument } from "@/shared/firestore";

const cardDocumentSchema = z.object({
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

const cardCreateDtoSchema = cardDocumentSchema.extend({
  id: z.string(),
});

const cardUpdateDtoSchema = cardDocumentSchema
  .omit({ id: true, score: true, numberOfSeen: true, lastSeenAt: true, nextSeeingAt: true, interval: true })
  .partial()
  .extend({
    updatedAt: z.number(),
  });

export type CardDocument = z.infer<typeof cardDocumentSchema>;
type CardContent = Omit<Card, "score" | "numberOfSeen" | "lastSeenAt" | "nextSeeingAt" | "interval">;
export type CardCreateDto = z.infer<typeof cardCreateDtoSchema>;
export type CardUpdateDto = z.infer<typeof cardUpdateDtoSchema>;

export const parseCardDocument = (id: CardId, value: unknown): CardDocument =>
  parseFirestoreDocument(cardDocumentSchema, "card", id, value);

export const mapCardDocument = (id: CardId, value: unknown): CardContent => {
  const document = parseCardDocument(id, value);
  const card: CardContent = {
    id,
    frontText: document.frontText,
    backText: document.backText,
    tags: document.tags,
    uniqueKey: document.uniqueKey,
    deckId: document.deckId,
    uid: document.uid,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    deletedAt: document.deletedAt,
  };
  if (document.url !== undefined) card.url = document.url;
  if (document.startLine !== undefined) card.startLine = document.startLine;
  if (document.endLine !== undefined) card.endLine = document.endLine;
  return card;
};

type OmitUndefined<T extends Record<string, unknown>> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

const omitUndefined = <T extends Record<string, unknown>>(value: T): OmitUndefined<T> =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as OmitUndefined<T>;

export const buildCardCreateDto = (card: Card, progress: StudyProgress, createdAt: number): CardCreateDto =>
  cardCreateDtoSchema.parse(
    omitUndefined({
      id: card.id,
      frontText: card.frontText,
      backText: card.backText,
      tags: card.tags,
      uniqueKey: card.uniqueKey,
      deckId: card.deckId,
      uid: card.uid,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
      score: progress.score,
      numberOfSeen: progress.numberOfSeen,
      lastSeenAt: progress.lastSeenAt,
      nextSeeingAt: progress.nextSeeingAt,
      interval: progress.interval,
      url: card.url,
      startLine: card.startLine,
      endLine: card.endLine,
    })
  );

export const buildCardUpdateDto = (card: CardEdit, updatedAt: number): CardUpdateDto =>
  cardUpdateDtoSchema.parse(
    omitUndefined({
      frontText: card.frontText,
      backText: card.backText,
      tags: card.tags,
      uniqueKey: card.uniqueKey,
      deckId: card.deckId,
      uid: card.uid,
      createdAt: card.createdAt,
      updatedAt,
      deletedAt: card.deletedAt,
      url: card.url,
      startLine: card.startLine,
      endLine: card.endLine,
    })
  );
