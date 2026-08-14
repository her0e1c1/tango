import { z } from "zod";

const authenticatedUidSchema = z.string().min(1, "A confirmed user is required for remote Card writes");
const cardIdSchema = z.string().min(1, "Card id is required");
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

const cardCreateSchema = editableCardFieldsSchema.extend({
  id: cardIdSchema,
  deckId: z.string().min(1, "Card deck is required"),
  uid: cardUidSchema,
  deletedAt: z.number().nullable().default(null),
  score: z.number().default(0),
  numberOfSeen: z.number().default(0),
  lastSeenAt: z.number().optional(),
  nextSeeingAt: z.date().optional(),
  interval: z.number().optional(),
});

const cardSchema = cardCreateSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
});

const cardEditSchema = editableCardFieldsSchema.partial().extend({ id: cardIdSchema, uid: cardUidSchema });
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

export type Card = z.infer<typeof cardSchema>;
export type CardCreate = z.infer<typeof cardCreateSchema>;
export type CardCreateInput = z.input<typeof cardCreateSchema>;
export type CardId = z.infer<typeof cardIdSchema>;
export type CardEdit = z.infer<typeof cardEditSchema>;
export type CardRaw = Pick<Card, "frontText" | "backText" | "uniqueKey" | "tags">;
export type EditCardInput = z.infer<typeof editCardSchema>;
export type DeleteCardInput = z.infer<typeof deleteCardSchema>;
