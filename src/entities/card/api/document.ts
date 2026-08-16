import { z } from "zod";

import { firestoreTimestampDateSchema, parseFirestoreDocument } from "@/shared/api";

// Reads accept compatible legacy values; command schemas enforce the stricter invariants required for new writes.
const cardDocumentSchema = z.object({
  // Older documents may duplicate the Firestore document id in their stored fields.
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

export const parseCardDocument = (id: string, value: unknown): CardDocument =>
  parseFirestoreDocument(cardDocumentSchema, "card", id, value);
