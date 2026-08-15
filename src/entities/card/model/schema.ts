import { z } from "zod";

const authenticatedUidSchema = z.string().min(1, "A confirmed user is required for remote Card writes");
export const cardIdSchema = z.string().min(1, "Card id is required");
const cardUidSchema = z.string().min(1, "Card owner is required");

const editableCardFieldsSchema = z.object({
  frontText: z.string(),
  backText: z.string(),
  tags: z.array(z.string()),
  uniqueKey: z.string(),
  url: z.string().optional(),
  startLine: z.number().optional(),
  endLine: z.number().optional(),
});

const cardCreateFieldsSchema = editableCardFieldsSchema.extend({
  id: cardIdSchema,
  deckId: z.string().min(1, "Card deck is required"),
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

export const localCardEditSchema = editableCardFieldsSchema.partial().extend({ id: cardIdSchema });
export const cardEditSchema = localCardEditSchema.extend({ uid: cardUidSchema });
const cardIdentitySchema = z.object({ id: cardIdSchema, uid: cardUidSchema });

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
