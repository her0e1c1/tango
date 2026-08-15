import { z } from "zod";

import { parseFirestoreDocument } from "@/shared/api";
import type { DeckDocument, DeckId } from "../model/types";

const deckDocumentSchema = z.object({
  // Older documents duplicate the Firestore document id in their data.
  id: z.string().optional(),
  name: z.string().trim().min(1, "Deck name is required."),
  url: z.url("Enter a valid URL.").optional(),
  isPublic: z.boolean(),
  uid: z.string().min(1, "Deck owner is required"),
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

export const parseDeckDocument = (id: DeckId, value: unknown): DeckDocument =>
  parseFirestoreDocument(deckDocumentSchema, "deck", id, value);
