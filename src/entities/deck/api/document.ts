import { z } from "zod";
import { serverTimestamp } from "firebase/firestore";

import { firestoreTimestampSchema, parseFirestoreDocument } from "@/shared/api";
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
  updatedAt: firestoreTimestampSchema,
  deletedAt: z.number().nullable(),
  selectedTags: z.array(z.string()),
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
    updatedAt: document.updatedAt.toDate().getTime(),
  });
};

// Adds the authenticated actor as physical owner only when crossing the Firestore persistence boundary.
export const toDeckDocument = (uid: string, deck: z.infer<typeof deckCreateSchema>, timestamp: number) =>
  omitUndefined({
    ...deck,
    uid,
    deletedAt: null,
    createdAt: timestamp,
    updatedAt: serverTimestamp(),
  });
