import { z } from "zod";

import { parseFirestoreDocument } from "@/shared/api";
import type { deckCreateSchema } from "../model/schema";
import type { Deck, DeckId } from "../model/types";

const deckDocumentSchema = z.object({
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
  scoreMax: z.number().nullable(),
  scoreMin: z.number().nullable(),
  selectedTags: z.array(z.string()),
  tagAndFilter: z.boolean(),
  category: z.string(),
  convertToBr: z.boolean(),
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
  isPublic: document.isPublic,
  scoreMax: document.scoreMax,
  scoreMin: document.scoreMin,
  selectedTags: document.selectedTags,
  tagAndFilter: document.tagAndFilter,
  category: document.category,
  convertToBr: document.convertToBr,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

// Converts a validated create input to the Firestore representation and adds server-owned timestamps.
export const toDeckDocument = (deck: z.infer<typeof deckCreateSchema>, timestamp: number): DeckDocument => ({
  id: deck.id,
  uid: deck.uid,
  name: deck.name,
  ...(deck.url === undefined ? {} : { url: deck.url }),
  isPublic: deck.isPublic,
  scoreMax: deck.scoreMax,
  scoreMin: deck.scoreMin,
  selectedTags: deck.selectedTags,
  tagAndFilter: deck.tagAndFilter,
  category: deck.category,
  convertToBr: deck.convertToBr,
  deletedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
});
