import { z } from "zod";

import { parseFirestoreDocument } from "@/shared/api";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { cardFilterSchema, type deckCreateSchema } from "../model/schema";
import type { Deck, DeckId } from "../model/types";

const deckDocumentSchema = z.object({
  // Older documents duplicate the Firestore document id in their data.
  id: z.string().optional(),
  name: z.string(),
  url: z.string().optional(),
  isPublic: z.boolean(),
  uid: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  selectedTags: z.array(z.string()),
  tags: z.array(z.string()).optional(),
  tagAndFilter: z.boolean(),
  cardFilter: cardFilterSchema.optional(),
  category: z.string(),
  convertToBr: z.boolean(),
});

/** Validated field shape stored in one physical Deck Firestore document. */
export type DeckDocument = z.infer<typeof deckDocumentSchema>;

// Parses one Firestore payload and reports Deck-specific validation context.
export const parseDeckDocument = (id: DeckId, value: unknown): DeckDocument =>
  parseFirestoreDocument(deckDocumentSchema, "deck", id, value);

// Converts a validated Firestore document to the Deck shape used by the application.
export const toDeck = (id: DeckId, document: DeckDocument): Deck => {
  const { id: _, deletedAt: __, ...rest } = document;
  return omitUndefined({
    ...rest,
    id,
  });
};

// Adds the authenticated actor as physical owner only when crossing the Firestore persistence boundary.
export const toDeckDocument = (uid: string, deck: z.infer<typeof deckCreateSchema>, timestamp: number): DeckDocument =>
  omitUndefined({
    ...deck,
    uid,
    deletedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
