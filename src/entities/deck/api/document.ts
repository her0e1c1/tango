import { z } from "zod";

import { difficultySchema, legacyScoreBoundsToDifficultyBounds } from "@/entities/study-progress/@x/deck";
import { parseFirestoreDocument } from "@/shared/api";
import type { deckCreateSchema } from "../model/schema";
import type { Deck, DeckId } from "../model/types";

const sharedDeckDocumentSchema = z.object({
  // Older documents duplicate the Firestore document id in their data.
  id: z.string().optional(),
  // Read validation remains permissive for legacy data; command schemas enforce current write constraints.
  name: z.string(),
  url: z.string().optional(),
  isPublic: z.boolean(),
  uid: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  selectedTags: z.array(z.string()),
  tagAndFilter: z.boolean(),
  category: z.string(),
  convertToBr: z.boolean(),
});

const deckDocumentSchema = sharedDeckDocumentSchema
  .extend({
    difficultyMax: difficultySchema.nullable().optional(),
    difficultyMin: difficultySchema.nullable().optional(),
    scoreMax: z.number().nullable().optional(),
    scoreMin: z.number().nullable().optional(),
  })
  .superRefine((document, context) => {
    // Each bound can be migrated independently by a partial edit; its reversed legacy source remains the fallback.
    if (document.difficultyMin === undefined && document.scoreMax === undefined) {
      context.addIssue({
        code: "custom",
        message: "Minimum difficulty or legacy maximum score is required",
        path: ["difficultyMin"],
      });
    }
    if (document.difficultyMax === undefined && document.scoreMin === undefined) {
      context.addIssue({
        code: "custom",
        message: "Maximum difficulty or legacy minimum score is required",
        path: ["difficultyMax"],
      });
    }
  });

/** Validated field shape stored in one physical Deck Firestore document. */
export type DeckDocument = z.infer<typeof deckDocumentSchema>;

// Parses one Firestore payload and reports Deck-specific validation context.
export const parseDeckDocument = (id: DeckId, value: unknown): DeckDocument =>
  parseFirestoreDocument(deckDocumentSchema, "deck", id, value);

// Converts a validated Firestore document to the Deck shape used by the application.
export const toDeck = (id: DeckId, document: DeckDocument): Extract<Deck, { localMode: false }> => {
  const legacyBounds = legacyScoreBoundsToDifficultyBounds(document.scoreMin ?? null, document.scoreMax ?? null);
  const difficultyBounds = {
    difficultyMin: document.difficultyMin === undefined ? legacyBounds.difficultyMin : document.difficultyMin,
    difficultyMax: document.difficultyMax === undefined ? legacyBounds.difficultyMax : document.difficultyMax,
  };
  return {
    id,
    uid: document.uid,
    localMode: false,
    name: document.name,
    ...(document.url === undefined ? {} : { url: document.url }),
    isPublic: document.isPublic,
    ...difficultyBounds,
    selectedTags: document.selectedTags,
    tagAndFilter: document.tagAndFilter,
    category: document.category,
    convertToBr: document.convertToBr,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
};

// Adds the authenticated actor as physical owner only when crossing the Firestore persistence boundary.
export const toDeckDocument = (
  uid: string,
  deck: z.infer<typeof deckCreateSchema>,
  timestamp: number
): DeckDocument => ({
  id: deck.id,
  uid,
  name: deck.name,
  ...(deck.url === undefined ? {} : { url: deck.url }),
  isPublic: deck.isPublic,
  difficultyMax: deck.difficultyMax,
  difficultyMin: deck.difficultyMin,
  selectedTags: deck.selectedTags,
  tagAndFilter: deck.tagAndFilter,
  category: deck.category,
  convertToBr: deck.convertToBr,
  deletedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
});
