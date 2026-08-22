import { z } from "zod";

export const authenticatedUidSchema = z.string().min(1, "A confirmed user is required for remote Deck writes");
export const deckIdSchema = z.string().min(1, "Deck id is required");
const deckUidSchema = z.string().min(1, "Deck owner is required");

const editableDeckFieldsSchema = z.object({
  name: z.string().trim().min(1, "Deck name is required."),
  url: z.url("Enter a valid URL.").optional(),
  isPublic: z.boolean(),
  scoreMax: z.number().nullable(),
  scoreMin: z.number().nullable(),
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
  scoreMax: editableDeckFieldsSchema.shape.scoreMax.default(null),
  scoreMin: editableDeckFieldsSchema.shape.scoreMin.default(null),
  selectedTags: editableDeckFieldsSchema.shape.selectedTags.default([]),
  tagAndFilter: editableDeckFieldsSchema.shape.tagAndFilter.default(false),
  category: editableDeckFieldsSchema.shape.category.default(""),
  convertToBr: editableDeckFieldsSchema.shape.convertToBr.default(false),
});

export const deckCreateSchema = deckCreateFieldsSchema.extend({
  uid: deckUidSchema,
  localMode: z.literal(false).default(false),
});

export const localDeckCreateSchema = deckCreateFieldsSchema.extend({ localMode: z.literal(true) });

// Persisted v1 Decks may predate defaulted filtering fields, so hydration must reuse the create defaults.
export const localDeckSchema = localDeckCreateSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const persistedDeckStateSchema = z.object({ localDecks: z.array(localDeckSchema) });

export const deckEditSchema = editableDeckFieldsSchema.partial().extend({
  id: deckIdSchema,
  url: editableDeckFieldsSchema.shape.url.nullable(),
  localMode: z.boolean().optional(),
});

// Rejects remote Deck commands whose stored owner differs from the authenticated user.
const validateDeckOwner = (input: { uid: string; deck: { uid: string } }, context: z.RefinementCtx): void => {
  if (input.deck.uid !== input.uid) {
    context.addIssue({
      code: "custom",
      message: "Deck owner does not match the authenticated user",
      path: ["deck", "uid"],
    });
  }
};

export const createDeckSchema = z
  .object({ uid: authenticatedUidSchema, deck: deckCreateSchema })
  .superRefine(validateDeckOwner);

export const editDeckSchema = z.object({
  uid: authenticatedUidSchema,
  deck: deckEditSchema,
});
