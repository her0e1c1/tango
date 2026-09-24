import { z } from "zod";
import { fsrsStateSchema } from "./fsrs";

import { isNonBlank } from "@/shared/lib/isNonBlank";

const authenticatedUidSchema = z.string().min(1, "A confirmed user is required for remote Card writes");
export const cardIdSchema = z.string().min(1, "Card id is required");
const cardDeckIdSchema = z.string().min(1, "Card deck is required");
const cardUidSchema = z.string().min(1, "Card owner is required");

const cardFrontTextSchema = z.string().refine(isNonBlank, { message: "Front text is required." });
const cardBackTextSchema = z.string().refine(isNonBlank, { message: "Back text is required." });
const cardUniqueKeySchema = z.string().refine(isNonBlank, { message: "Unique key is required." });

export const cardContentSchema = z.object({
  frontText: cardFrontTextSchema,
  backText: cardBackTextSchema,
  tags: z.array(z.string()),
  uniqueKey: cardUniqueKeySchema,
});

// Creation assigns the identity and editing preserves it; neither asks for it as content input.
export const cardContentInputSchema = cardContentSchema.omit({ uniqueKey: true }).extend({
  tags: z.array(z.string().refine(isNonBlank, { message: "required" })).superRefine((tags, context) => {
    tags.forEach((tag, index) => {
      if (tags.indexOf(tag) !== index) context.addIssue({ code: "custom", message: "duplicate", path: [index] });
    });
  }),
});

const cardCreateFieldsSchema = cardContentSchema.extend({
  id: cardIdSchema,
  deckId: cardDeckIdSchema,
  deletedAt: z.number().nullable().default(null),
});

export const cardCreateSchema = cardCreateFieldsSchema.extend({ uid: cardUidSchema });

export const cardSchema = cardCreateSchema.extend({
  fsrs: fsrsStateSchema.nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const cardContentEditSchema = cardContentSchema.partial().extend({ id: cardIdSchema });
export const cardEditSchema = cardContentEditSchema.extend({ uid: cardUidSchema });
const cardIdentitySchema = z.object({ id: cardIdSchema, uid: cardUidSchema });

// Ownership is established by the authenticated session and must never be selectable by a remote mutation payload.
const validateCardOwner = (input: { uid: string; card: { uid: string } }, context: z.RefinementCtx): void => {
  if (input.card.uid !== input.uid) {
    context.addIssue({
      code: "custom",
      message: "Card owner does not match the authenticated user",
      path: ["card", "uid"],
    });
  }
};

export const createCardSchema = z
  .object({ uid: authenticatedUidSchema, card: cardCreateSchema })
  .superRefine(validateCardOwner);

export const editCardSchema = z
  .object({
    uid: authenticatedUidSchema,
    card: cardEditSchema,
  })
  .superRefine(validateCardOwner);

export const deleteCardSchema = z
  .object({ uid: authenticatedUidSchema, card: cardIdentitySchema })
  .superRefine(validateCardOwner);
