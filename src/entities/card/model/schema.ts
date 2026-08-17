import { z } from "zod";

import { isNonBlank } from "@/shared/lib/isNonBlank";

const authenticatedUidSchema = z.string().min(1, "A confirmed user is required for remote Card writes");
export const cardIdSchema = z.string().min(1, "Card id is required");
export const cardDeckIdSchema = z.string().min(1, "Card deck is required");
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

const editableCardFieldsSchema = cardContentSchema.extend({
  url: z.string().optional(),
  startLine: z.number().optional(),
  endLine: z.number().optional(),
});

const cardCreateFieldsSchema = editableCardFieldsSchema.extend({
  id: cardIdSchema,
  deckId: cardDeckIdSchema,
  deletedAt: z.number().nullable().default(null),
});

export const cardCreateSchema = cardCreateFieldsSchema.extend({ uid: cardUidSchema });
export const localCardCreateSchema = cardCreateFieldsSchema;

export const cardSchema = cardCreateSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const localCardSchema = localCardCreateSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const persistedCardStateSchema = z.object({ localCards: z.array(localCardSchema) });

export const localCardEditSchema = editableCardFieldsSchema.partial().extend({ id: cardIdSchema });
export const cardEditSchema = localCardEditSchema.extend({ uid: cardUidSchema });
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
