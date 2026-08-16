import { z } from "zod";

import { parseFirestoreDocument } from "@/shared/api";
import type { DeckDocument, DeckId } from "../model/types";

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

// Parses one Firestore payload and reports Deck-specific validation context.
export const parseDeckDocument = (id: DeckId, value: unknown): DeckDocument =>
  parseFirestoreDocument(deckDocumentSchema, "deck", id, value);
