import { z } from "zod";

import { parseFirestoreDocument } from "@/shared/api";
import { deckDomainSchema } from "../model/schema";
import type { DeckCreate, DeckId, RemoteDeck } from "../model/types";

const deckDocumentSchema = deckDomainSchema.omit({ id: true }).extend({
  // Older documents duplicate the Firestore document id in their data.
  id: z.string().optional(),
  uid: z.string().min(1, "Deck owner is required"),
  deletedAt: z.number().nullable(),
});

export type DeckDocument = z.infer<typeof deckDocumentSchema>;

export const parseDeckDocument = (id: DeckId, value: unknown): DeckDocument =>
  parseFirestoreDocument(deckDocumentSchema, "deck", id, value);

export const toRemoteDeckStore = (id: DeckId, document: DeckDocument): RemoteDeck => {
  const { deletedAt: _deletedAt, id: _storedId, ...deck } = document;
  return { ...deck, id, localMode: false };
};

export const toDeckDocument = (deck: DeckCreate, timestamp: number): DeckDocument => ({
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
