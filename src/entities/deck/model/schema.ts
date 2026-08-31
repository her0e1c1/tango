import { z } from "zod";

import { difficultySchema, legacyScoreBoundsToDifficultyBounds } from "@/entities/study-progress/@x/deck";

export const authenticatedUidSchema = z.string().min(1, "A confirmed user is required for remote Deck writes");
export const deckIdSchema = z.string().min(1, "Deck id is required");

const editableDeckFieldsSchema = z.object({
  name: z.string().trim().min(1, "Deck name is required."),
  url: z.url("Enter a valid URL.").optional(),
  isPublic: z.boolean(),
  difficultyMax: difficultySchema.nullable(),
  difficultyMin: difficultySchema.nullable(),
  selectedTags: z.array(z.string()),
  tagAndFilter: z.boolean(),
  category: z.string(),
  convertToBr: z.boolean(),
});

export const deckFormSchema = editableDeckFieldsSchema
  .pick({
    name: true,
    category: true,
    url: true,
    convertToBr: true,
  })
  .extend({ localMode: z.boolean().optional() });

const deckCreateFieldsSchema = editableDeckFieldsSchema.extend({
  id: deckIdSchema,
  isPublic: editableDeckFieldsSchema.shape.isPublic.default(false),
  difficultyMax: editableDeckFieldsSchema.shape.difficultyMax.default(null),
  difficultyMin: editableDeckFieldsSchema.shape.difficultyMin.default(null),
  selectedTags: editableDeckFieldsSchema.shape.selectedTags.default([]),
  tagAndFilter: editableDeckFieldsSchema.shape.tagAndFilter.default(false),
  category: editableDeckFieldsSchema.shape.category.default(""),
  convertToBr: editableDeckFieldsSchema.shape.convertToBr.default(false),
});

export const deckCreateSchema = deckCreateFieldsSchema.extend({
  localMode: z.literal(false).default(false),
});

export const localDeckCreateSchema = deckCreateFieldsSchema.extend({ localMode: z.literal(true) });

// Persisted v1 Decks may predate defaulted filtering fields, so hydration must reuse the create defaults.
export const localDeckSchema = localDeckCreateSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
});

const adaptLegacyPersistedDeck = (value: unknown): unknown => {
  if (value === null || typeof value !== "object") return value;
  if (Object.hasOwn(value, "difficultyMin") || Object.hasOwn(value, "difficultyMax")) return value;
  if (!(Object.hasOwn(value, "scoreMin") && Object.hasOwn(value, "scoreMax"))) return value;
  const persistedDeck = value as Record<string, unknown>;
  const { scoreMin, scoreMax } = persistedDeck;
  const isLegacyBound = (bound: unknown): bound is number | null =>
    bound === null || (typeof bound === "number" && Number.isFinite(bound));
  if (!(isLegacyBound(scoreMin) && isLegacyBound(scoreMax))) {
    return { ...persistedDeck, difficultyMin: scoreMax, difficultyMax: scoreMin };
  }
  return {
    ...persistedDeck,
    ...legacyScoreBoundsToDifficultyBounds(scoreMin, scoreMax),
  };
};

const persistedDeckSchema = z.preprocess(adaptLegacyPersistedDeck, localDeckSchema);
export const persistedDeckStateSchema = z.object({ localDecks: z.array(persistedDeckSchema) });

export const deckEditSchema = editableDeckFieldsSchema.partial().extend({
  id: deckIdSchema,
  url: editableDeckFieldsSchema.shape.url.nullable(),
  localMode: z.boolean().optional(),
});

export const createDeckSchema = z.object({ uid: authenticatedUidSchema, deck: deckCreateSchema });

export const editDeckSchema = z.object({
  uid: authenticatedUidSchema,
  deck: deckEditSchema,
});
