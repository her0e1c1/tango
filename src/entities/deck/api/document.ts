import { z } from "zod";

import { parseFirestoreDocument } from "@/shared/api";
import type { DeckCreate, DeckId, RemoteDeck } from "../model/types";

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

export type DeckDocument = z.infer<typeof deckDocumentSchema>;

export const parseDeckDocument = (id: DeckId, value: unknown): DeckDocument =>
  parseFirestoreDocument(deckDocumentSchema, "deck", id, value);

export const toRemoteDeckStore = (id: DeckId, document: DeckDocument): RemoteDeck => ({
  id,
  uid: document.uid,
  localMode: false,
  name: document.name,
  ...(document.url === undefined ? {} : { url: document.url }),
  isPublic: document.isPublic,
  scoreMax: document.scoreMax,
  scoreMin: document.scoreMin,
  selectedTags: [...document.selectedTags],
  tagAndFilter: document.tagAndFilter,
  category: document.category,
  convertToBr: document.convertToBr,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

export const toDeckDocument = (deck: DeckCreate, timestamp: number): DeckDocument => ({
  id: deck.id,
  uid: deck.uid,
  name: deck.name,
  ...(deck.url === undefined ? {} : { url: deck.url }),
  isPublic: deck.isPublic,
  scoreMax: deck.scoreMax,
  scoreMin: deck.scoreMin,
  selectedTags: [...deck.selectedTags],
  tagAndFilter: deck.tagAndFilter,
  category: deck.category,
  convertToBr: deck.convertToBr,
  deletedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
});
