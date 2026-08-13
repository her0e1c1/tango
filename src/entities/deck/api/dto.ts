import type { Deck, DeckId } from "../model/deck";

import { z } from "zod";

import { parseFirestoreDocument } from "@/shared/firestore";

const deckDtoSchema = z.object({
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

type DeckDto = z.infer<typeof deckDtoSchema>;

const parseDeckDto = (id: DeckId, value: unknown): DeckDto => parseFirestoreDocument(deckDtoSchema, "deck", id, value);

export const convertDeckDtoToDeck = (id: DeckId, value: unknown): Deck => {
  const dto = parseDeckDto(id, value);
  const deck: Deck = {
    id,
    name: dto.name,
    isPublic: dto.isPublic,
    uid: dto.uid,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deletedAt: dto.deletedAt,
    scoreMax: dto.scoreMax,
    scoreMin: dto.scoreMin,
    selectedTags: dto.selectedTags,
    tagAndFilter: dto.tagAndFilter,
    category: dto.category,
    convertToBr: dto.convertToBr,
  };
  if (dto.url !== undefined) deck.url = dto.url;
  return deck;
};
