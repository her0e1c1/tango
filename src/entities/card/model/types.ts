import type { z } from "zod";

import type {
  cardContentInputSchema,
  cardCreateSchema,
  cardEditSchema,
  cardIdSchema,
  cardSchema,
  deleteCardSchema,
  editCardSchema,
  cardContentEditSchema,
} from "./schema";

/** Firestore-backed Card data whose ownership and deletion metadata must remain at the Entity boundary. */
export type RemoteCard = z.infer<typeof cardSchema>;
export type Card = RemoteCard;
/** Shared create/edit content without identity or persistence metadata. */
export type CardContentInput = z.infer<typeof cardContentInputSchema>;
/** Validated payload used to create a remote Card document. */
export type CardCreate = z.infer<typeof cardCreateSchema>;
/** Input accepted at the remote Card creation boundary. */
export type CardCreateInput = z.input<typeof cardCreateSchema>;
/** Input accepted at the owner-free Card creation boundary. */
type CardContentCreateInput = Omit<CardCreateInput, "uid">;
/** Owner-free fields accepted by the single-Card creation workflow. */
export type CardCreateCommand = Pick<
  CardContentCreateInput,
  "id" | "deckId" | "frontText" | "backText" | "tags" | "uniqueKey"
>;
/** Validated stable identifier for a Card. */
export type CardId = z.infer<typeof cardIdSchema>;
/** Validated editable fields for a remote Card. */
export type CardEdit = z.infer<typeof cardEditSchema>;
/** Validated partial edit for a owner-free Card. */
type CardContentEdit = z.infer<typeof cardContentEditSchema>;
/** Persistence-agnostic Card edit accepted by mutation orchestration. */
export type CardEditInput = CardContentEdit;
/** Create payload accepted by a bulk Card mutation. */
type CardMutationCreateInput = CardContentCreateInput;
/** Create or edit command applied during a bulk Card mutation. */
export type CardMutation = { kind: "create"; card: CardMutationCreateInput } | { kind: "edit"; card: CardEditInput };
/** User-editable Card content independent of identity and persistence metadata. */
export type CardRaw = Pick<Card, "frontText" | "backText" | "uniqueKey" | "tags">;
/** Validated owner and Card payload for a remote edit command. */
export type EditCardInput = z.infer<typeof editCardSchema>;
/** Validated owner and Card identity for a remote delete command. */
export type DeleteCardInput = z.infer<typeof deleteCardSchema>;
