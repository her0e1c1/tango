import { z } from "zod";

const authenticatedUidSchema = z.string().min(1, "A confirmed user is required for remote Deck writes");
export const deckIdSchema = z.string().min(1, "Deck id is required");
const deckUidSchema = z.string().min(1, "Deck owner is required");

const editableDeckFieldsSchema = z.object({
  name: z.string().min(1, "Deck name is required"),
  url: z.string().optional(),
  isPublic: z.boolean(),
  scoreMax: z.number().nullable(),
  scoreMin: z.number().nullable(),
  selectedTags: z.array(z.string()),
  tagAndFilter: z.boolean(),
  category: z.string(),
  convertToBr: z.boolean(),
});

export const deckCreateSchema = editableDeckFieldsSchema.extend({
  id: deckIdSchema,
  uid: deckUidSchema,
  isPublic: editableDeckFieldsSchema.shape.isPublic.default(false),
  scoreMax: editableDeckFieldsSchema.shape.scoreMax.default(null),
  scoreMin: editableDeckFieldsSchema.shape.scoreMin.default(null),
  selectedTags: editableDeckFieldsSchema.shape.selectedTags.default([]),
  tagAndFilter: editableDeckFieldsSchema.shape.tagAndFilter.default(false),
  category: editableDeckFieldsSchema.shape.category.default(""),
  convertToBr: editableDeckFieldsSchema.shape.convertToBr.default(false),
  deletedAt: z.number().nullable().default(null),
});

export const deckSchema = deckCreateSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const deckEditSchema = editableDeckFieldsSchema.partial().extend({ id: deckIdSchema });
const deckIdentitySchema = z.object({ id: deckIdSchema, uid: deckUidSchema });

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

export const deleteDeckSchema = z
  .object({ uid: authenticatedUidSchema, deck: deckIdentitySchema })
  .superRefine(validateDeckOwner);
