import { z } from "zod";

import { mapStudyProgressDocument, type StudyProgress } from "@/entities/study-progress/@x/card";
import { firestoreTimestampDateSchema, parseFirestoreDocument } from "@/shared/api";
import type { CardId, RemoteCardRead } from "../model/types";

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

export type CardDocument = z.infer<typeof cardDocumentSchema>;
export interface CardReadModels {
  card: RemoteCardRead;
  progress: StudyProgress;
}

const parseCardDocument = (id: string, value: unknown): CardDocument =>
  parseFirestoreDocument(cardDocumentSchema, "card", id, value);

const mapCardDocument = (id: CardId, document: CardDocument): RemoteCardRead => {
  const card: RemoteCardRead = {
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

export const readCardDocument = (id: CardId, value: unknown): CardReadModels => {
  const document = parseCardDocument(id, value);
  return {
    card: mapCardDocument(id, document),
    progress: mapStudyProgressDocument(id, document),
  };
};
