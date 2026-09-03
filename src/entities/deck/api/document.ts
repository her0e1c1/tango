import { z } from "zod";

import { difficultySchema } from "@/entities/study-progress/@x/deck";
import { parseFirestoreDocument } from "@/shared/api";
import type { deckCreateSchema } from "../model/schema";
import type { Deck, DeckId } from "../model/types";

// Keep this parser non-strict so retired fields such as isPublic are stripped without rejecting a legacy document.
const sharedDeckDocumentSchema = z.object({
  // Older documents duplicate the Firestore document id in their data.
  id: z.string().optional(),
  name: z.string(),
  url: z.string().optional(),
  uid: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  selectedTags: z.array(z.string()),
  tagAndFilter: z.boolean(),
  category: z.string(),
  convertToBr: z.boolean(),
});

const deckDocumentSchema = sharedDeckDocumentSchema.extend({
  difficultyMax: difficultySchema.nullable(),
  difficultyMin: difficultySchema.nullable(),
});

/** Validated field shape stored in one physical Deck Firestore document. */
export type DeckDocument = z.infer<typeof deckDocumentSchema>;

// Parses one Firestore payload and reports Deck-specific validation context.
export const parseDeckDocument = (id: DeckId, value: unknown): DeckDocument =>
  parseFirestoreDocument(deckDocumentSchema, "deck", id, value);

// Converts a validated Firestore document to the Deck shape used by the application.
export const toDeck = (id: DeckId, document: DeckDocument): Extract<Deck, { localMode: false }> => ({
  id,
  uid: document.uid,
  localMode: false,
  name: document.name,
  ...(document.url === undefined ? {} : { url: document.url }),
  difficultyMax: document.difficultyMax,
  difficultyMin: document.difficultyMin,
  selectedTags: document.selectedTags,
  tagAndFilter: document.tagAndFilter,
  category: document.category,
  convertToBr: document.convertToBr,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

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
