import { z } from "zod";

export const authenticatedUidSchema = z.string().min(1, "A confirmed user is required for remote Deck writes");
export const deckIdSchema = z.string().min(1, "Deck id is required");

export const cardFilterSchema = z.object({
  /** Selected tags; an empty collection does not restrict Cards. */
  selectedTags: z.array(z.string()),
  /** True requires every selected tag; false requires any selected tag. */
  tagAndFilter: z.boolean(),
});

const editableDeckFieldsSchema = z.object({
  /** Deck label; validation trims whitespace and requires a non-empty value. */
  name: z.string().trim().min(1, "Deck name is required."),
  /** Optional source URL; when supplied, it must be a valid URL. */
  url: z.url("Enter a valid URL.").optional(),
  /** Whether the Deck is marked for public visibility. */
  isPublic: z.boolean(),
  /** Optional conditions for selecting Cards at study start; an unset filter does not restrict Cards by tag. */
  studyFilter: cardFilterSchema.optional(),
  /** Optional independent browsing filter; an unset filter displays every Card. */
  cardFilter: cardFilterSchema.optional(),
  /** Fallback rendering category when Card tags do not select one. */
  category: z.string(),
  /** Whether imported text converts two consecutive line breaks into one HTML <br />. */
  convertToBr: z.boolean(),
});

export const deckFormSchema = editableDeckFieldsSchema.pick({
  name: true,
  category: true,
  url: true,
  convertToBr: true,
});

const deckCreateFieldsSchema = editableDeckFieldsSchema.extend({
  /** Non-empty stable identity assigned to the new Deck. */
  id: deckIdSchema,
  /** Public visibility; omitted or undefined defaults to false. */
  isPublic: editableDeckFieldsSchema.shape.isPublic.default(false),
  /** Rendering category; omitted or undefined defaults to an empty string. */
  category: editableDeckFieldsSchema.shape.category.default(""),
  /** Line-break conversion; omitted or undefined defaults to false. */
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
