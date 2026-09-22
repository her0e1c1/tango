import { z } from "zod";

export const authenticatedUidSchema = z.string().min(1, "A confirmed user is required for remote Deck writes");
export const deckIdSchema = z.string().min(1, "Deck id is required");

const editableDeckFieldsSchema = z.object({
  name: z.string().trim().min(1, "Deck name is required."),
  url: z.url("Enter a valid URL.").optional(),
  isPublic: z.boolean(),
  selectedTags: z.array(z.string()),
  tagAndFilter: z.boolean(),
  category: z.string(),
  convertToBr: z.boolean(),
});

export const deckFormSchema = editableDeckFieldsSchema.pick({
  name: true,
  category: true,
  url: true,
  convertToBr: true,
});

const deckCreateFieldsSchema = editableDeckFieldsSchema.extend({
  id: deckIdSchema,
  isPublic: editableDeckFieldsSchema.shape.isPublic.default(false),
  selectedTags: editableDeckFieldsSchema.shape.selectedTags.default([]),
  tagAndFilter: editableDeckFieldsSchema.shape.tagAndFilter.default(false),
  category: editableDeckFieldsSchema.shape.category.default(""),
  convertToBr: editableDeckFieldsSchema.shape.convertToBr.default(false),
});

export const deckCreateSchema = deckCreateFieldsSchema;

export const deckEditSchema = editableDeckFieldsSchema.partial().extend({
  id: deckIdSchema,
  url: editableDeckFieldsSchema.shape.url.nullable(),
});

export const createDeckSchema = z.object({ uid: authenticatedUidSchema, deck: deckCreateSchema });

export const editDeckSchema = z.object({
  uid: authenticatedUidSchema,
  deck: deckEditSchema,
});
