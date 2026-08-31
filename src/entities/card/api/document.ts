import { z } from "zod";

import { difficultySchema, type StudyProgressDocumentFields } from "@/entities/study-progress/@x/card";
import { firestoreTimestampDateSchema, parseFirestoreDocument } from "@/shared/api";

// Reads accept compatible legacy values; command schemas enforce the stricter invariants required for new writes.
const sharedCardDocumentSchema = z.object({
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
  numberOfSeen: z.number(),
  lastSeenAt: z.number().optional(),
  nextSeeingAt: firestoreTimestampDateSchema.optional(),
  interval: z.number().optional(),
  url: z.string().optional(),
  startLine: z.number().optional(),
  endLine: z.number().optional(),
});

type SharedCardDocument = z.infer<typeof sharedCardDocumentSchema>;

/** Validated field shape stored in one physical Card Firestore document. */
export type CardDocument = SharedCardDocument & StudyProgressDocumentFields;

const cardDocumentSchema = sharedCardDocumentSchema
  .extend({
    difficulty: difficultySchema.optional(),
    score: z.number().optional(),
  })
  .superRefine((document, context) => {
    // A missing difficulty is compatible only when a validated legacy score can supply it.
    if (document.difficulty === undefined && document.score === undefined) {
      context.addIssue({ code: "custom", message: "Difficulty or legacy score is required", path: ["difficulty"] });
    }
  })
  // The refinement above establishes the discriminated StudyProgress persistence contract.
  .transform((document): CardDocument => document as CardDocument);

// Parses one Firestore payload and reports Card-specific validation context.
export const parseCardDocument = (id: string, value: unknown): CardDocument =>
  parseFirestoreDocument(cardDocumentSchema, "card", id, value);
