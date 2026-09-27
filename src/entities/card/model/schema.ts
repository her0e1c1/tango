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
  /** Non-blank question content. */
  frontText: cardFrontTextSchema,
  /** Non-blank answer content. */
  backText: cardBackTextSchema,
  /** Tags attached to the Card; content forms require non-blank, unique entries. */
  tags: z.array(z.string()),
  /** Non-blank identity used to match imported content. */
  uniqueKey: cardUniqueKeySchema,
});

// Creation assigns the identity and editing preserves it; neither asks for it as content input.
export const cardContentInputSchema = cardContentSchema.omit({ uniqueKey: true }).extend({
  /** Tags attached to the Card; content forms require non-blank, unique entries. */
  tags: z.array(z.string().refine(isNonBlank, { message: "required" })).superRefine((tags, context) => {
    tags.forEach((tag, index) => {
      if (tags.indexOf(tag) !== index) context.addIssue({ code: "custom", message: "duplicate", path: [index] });
    });
  }),
});

const cardCreateFieldsSchema = cardContentSchema.extend({
  /** Stable identity of the Card document. */
  id: cardIdSchema,
  /** Non-empty identity of the containing Deck. */
  deckId: cardDeckIdSchema,
  /** Deletion time in Unix milliseconds; omitted or undefined defaults to null (active). */
  deletedAt: z.number().nullable().default(null),
});

export const cardCreateSchema = cardCreateFieldsSchema.extend({
  /** Non-empty Firebase UID of the Card owner. */
  uid: cardUidSchema,
});

export const cardSchema = cardCreateSchema.extend({
  /** Review schedule; null means the Card has not been reviewed. */
  fsrs: fsrsStateSchema.nullable(),
  /** Document creation time in Unix milliseconds. */
  createdAt: z.number(),
  /** Last modification time in Unix milliseconds. */
  updatedAt: z.number(),
});

export const cardContentEditSchema = cardContentSchema.partial().extend({
  /** Stable identity of the Card to update. */
  id: cardIdSchema,
});
export const cardEditSchema = cardContentEditSchema.extend({
  /** Non-empty Firebase UID of the Card owner. */
  uid: cardUidSchema,
});
const cardIdentitySchema = z.object({
  /** Stable identity of the Card to delete. */
  id: cardIdSchema,
  /** Non-empty Firebase UID of the Card owner. */
  uid: cardUidSchema,
});

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
    /** Confirmed Firebase UID, which must match the payload owner. */
    uid: authenticatedUidSchema,
    /** Validated identity, ownership, and partial content update. */
    card: cardEditSchema,
  })
  .superRefine(validateCardOwner);

export const deleteCardSchema = z
  .object({
    /** Confirmed Firebase UID, which must match the payload owner. */
    uid: authenticatedUidSchema,
    /** Identity and ownership of the Card to delete. */
    card: cardIdentitySchema,
  })
  .superRefine(validateCardOwner);
