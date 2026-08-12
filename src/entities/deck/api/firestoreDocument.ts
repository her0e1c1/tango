import type { Deck, DeckEdit, DeckId } from "../model/deck";

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

const deckCreateDtoSchema = deckDocumentSchema.extend({
  id: z.string(),
});

const deckUpdateDtoSchema = deckDocumentSchema.omit({ id: true }).partial().extend({
  updatedAt: z.number(),
});

type DeckDocument = z.infer<typeof deckDocumentSchema>;
export type DeckCreateDto = z.infer<typeof deckCreateDtoSchema>;
export type DeckUpdateDto = z.infer<typeof deckUpdateDtoSchema>;

const parseDeckDocument = (id: DeckId, value: unknown): DeckDocument =>
  parseFirestoreDocument(deckDocumentSchema, "deck", id, value);

export const mapDeckDocument = (id: DeckId, value: unknown): Deck => {
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

type OmitUndefined<T extends Record<string, unknown>> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

const omitUndefined = <T extends Record<string, unknown>>(value: T): OmitUndefined<T> =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as OmitUndefined<T>;

export const buildDeckCreateDto = (deck: Deck, createdAt: number): DeckCreateDto =>
  deckCreateDtoSchema.parse(
    omitUndefined({
      id: deck.id,
      name: deck.name,
      url: deck.url,
      isPublic: deck.isPublic,
      uid: deck.uid,
      createdAt,
      updatedAt: createdAt,
      deletedAt: deck.deletedAt,
      scoreMax: deck.scoreMax,
      scoreMin: deck.scoreMin,
      selectedTags: deck.selectedTags,
      tagAndFilter: deck.tagAndFilter,
      category: deck.category,
      convertToBr: deck.convertToBr,
    })
  );

export const buildDeckUpdateDto = (deck: DeckEdit, updatedAt: number): DeckUpdateDto =>
  deckUpdateDtoSchema.parse(
    omitUndefined({
      name: deck.name,
      url: deck.url,
      isPublic: deck.isPublic,
      uid: deck.uid,
      createdAt: deck.createdAt,
      updatedAt,
      deletedAt: deck.deletedAt,
      scoreMax: deck.scoreMax,
      scoreMin: deck.scoreMin,
      selectedTags: deck.selectedTags,
      tagAndFilter: deck.tagAndFilter,
      category: deck.category,
      convertToBr: deck.convertToBr,
    })
  );
