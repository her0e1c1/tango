import type { CardId, RemoteCard } from "../model/types";
import { z } from "zod";
import { fsrsStateSchema } from "../model/fsrs";

import { firestoreTimestampSchema, parseFirestoreDocument } from "@/shared/api";

const cardDocumentSchema = z.object({
  // Older documents may duplicate the Firestore document id in their stored fields.
  id: z.string().optional(),
  fsrs: fsrsStateSchema.nullable(),
  frontText: z.string(),
  backText: z.string(),
  tags: z.array(z.string()),
  uniqueKey: z.string(),
  deckId: z.string(),
  uid: z.string(),
  createdAt: z.number(),
  updatedAt: firestoreTimestampSchema,
  deletedAt: z.number().nullable(),
});

/** Validated field shape stored in one physical Card Firestore document. */
export type CardDocument = z.infer<typeof cardDocumentSchema>;

// Parses one Firestore payload and reports Card-specific validation context.
export const parseCardDocument = (id: string, value: unknown): CardDocument =>
  parseFirestoreDocument(cardDocumentSchema, "card", id, value);

/** Maps only Card-owned document fields into the remote Card. */
export const mapCardDocument = (id: CardId, document: CardDocument): RemoteCard => {
  const card: RemoteCard = {
    id,
    fsrs: document.fsrs,
    frontText: document.frontText,
    backText: document.backText,
    tags: document.tags,
    uniqueKey: document.uniqueKey,
    deckId: document.deckId,
    uid: document.uid,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt.toDate().getTime(),
    deletedAt: document.deletedAt,
  };
  return card;
};
