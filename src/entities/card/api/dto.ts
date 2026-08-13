import type { Card, CardId } from "../model/card";

import { z } from "zod";

import { firestoreTimestampDateSchema, parseFirestoreDocument } from "@/shared/firestore";

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

const parseCardDto = (id: CardId, value: unknown): CardDto => parseFirestoreDocument(cardDtoSchema, "card", id, value);

export const parseCardCreateDto = (id: CardId, value: unknown) =>
  parseFirestoreDocument(cardCreateDtoSchema, "card", id, value);

export const parseCardUpdateDto = (id: CardId, value: unknown) =>
  parseFirestoreDocument(cardUpdateDtoSchema, "card", id, value);

export const convertCardDtoToCard = (id: CardId, value: unknown): Card => {
  const dto = parseCardDto(id, value);
  const card: Card = {
    id,
    frontText: dto.frontText,
    backText: dto.backText,
    tags: dto.tags,
    uniqueKey: dto.uniqueKey,
    deckId: dto.deckId,
    uid: dto.uid,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deletedAt: dto.deletedAt,
    score: dto.score,
    numberOfSeen: dto.numberOfSeen,
  };
  if (dto.lastSeenAt !== undefined) card.lastSeenAt = dto.lastSeenAt;
  if (dto.nextSeeingAt !== undefined) card.nextSeeingAt = dto.nextSeeingAt;
  if (dto.interval !== undefined) card.interval = dto.interval;
  if (dto.url !== undefined) card.url = dto.url;
  if (dto.startLine !== undefined) card.startLine = dto.startLine;
  if (dto.endLine !== undefined) card.endLine = dto.endLine;
  return card;
};
