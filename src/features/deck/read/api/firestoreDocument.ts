import type { Deck, DeckId } from "@/entities/deck";

import { z } from "zod";

import { parseFirestoreDocument } from "@/shared/firestore";

const deckDocumentSchema = z.object({
  id: z.string().optional(),
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

type DeckDocument = z.infer<typeof deckDocumentSchema>;

const parseDeckDocument = (id: DeckId, value: unknown): DeckDocument =>
  parseFirestoreDocument(deckDocumentSchema, "deck", id, value);

export const convertDeckDocumentToDeck = (id: DeckId, value: unknown): Deck => {
  const document = parseDeckDocument(id, value);
  const deck: Deck = {
    id,
    name: document.name,
    isPublic: document.isPublic,
    uid: document.uid,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    deletedAt: document.deletedAt,
    scoreMax: document.scoreMax,
    scoreMin: document.scoreMin,
    selectedTags: document.selectedTags,
    tagAndFilter: document.tagAndFilter,
    category: document.category,
    convertToBr: document.convertToBr,
  };
  if (document.url !== undefined) deck.url = document.url;
  return deck;
};
