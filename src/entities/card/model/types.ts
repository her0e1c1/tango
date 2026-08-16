import type { z } from "zod";

import type {
  cardCreateSchema,
  cardEditSchema,
  cardIdSchema,
  cardSchema,
  deleteCardSchema,
  editCardSchema,
  localCardCreateSchema,
  localCardEditSchema,
  localCardSchema,
  persistedCardStateSchema,
} from "./schema";

/** Firestore-backed Card data whose ownership and deletion metadata must remain at the Entity boundary. */
export type RemoteCard = z.infer<typeof cardSchema>;
/** Learning-progress fields retained only by the legacy combined Card model. */
type StudyProgressField = "score" | "numberOfSeen" | "lastSeenAt" | "nextSeeingAt" | "interval";
/** Firestore Card read model without StudyProgress-owned fields. */
export type RemoteCardRead = Omit<RemoteCard, StudyProgressField>;
/** Card-owned fields read from the shared physical Firestore document. */
export type CardDocumentFields = Omit<RemoteCardRead, "id">;
/** Browser-persisted Card data owned by a local-mode Deck and therefore intentionally lacking a uid. */
export type LocalCard = z.infer<typeof localCardSchema>;
/** Browser-persisted subset of Card state. */
export type PersistedCardState = z.infer<typeof persistedCardStateSchema>;
/** Entity read model spanning both persistence modes; mutations route through the owning Deck. */
export type Card = RemoteCard | LocalCard;
/** Validated payload used to create a remote Card document. */
export type CardCreate = z.infer<typeof cardCreateSchema>;
/** Input accepted at the remote Card creation boundary. */
export type CardCreateInput = z.input<typeof cardCreateSchema>;
/** Input accepted at the local Card creation boundary. */
export type LocalCardCreateInput = z.input<typeof localCardCreateSchema>;
/** Validated stable identifier for a Card. */
export type CardId = z.infer<typeof cardIdSchema>;
/** Validated editable fields for a remote Card. */
export type CardEdit = z.infer<typeof cardEditSchema>;
/** Validated partial edit for a local Card. */
export type LocalCardEdit = z.infer<typeof localCardEditSchema>;
/** Persistence-agnostic Card edit accepted by mutation orchestration. */
export type CardEditInput = LocalCardEdit;
/** Create payload accepted by a persistence-routed Card mutation. */
export type CardMutationCreateInput = CardCreateInput | LocalCardCreateInput;
/** Create or edit command applied during a bulk Card mutation. */
export type CardMutation = { kind: "create"; card: CardMutationCreateInput } | { kind: "edit"; card: CardEditInput };
/** User-editable Card content independent of identity and persistence metadata. */
export type CardRaw = Pick<Card, "frontText" | "backText" | "uniqueKey" | "tags">;
/** Validated owner and Card payload for a remote edit command. */
export type EditCardInput = z.infer<typeof editCardSchema>;
/** Validated owner and Card identity for a remote delete command. */
export type DeleteCardInput = z.infer<typeof deleteCardSchema>;
