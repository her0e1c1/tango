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
} from "./schema";

/** Firestore-backed Card data whose ownership and deletion metadata must remain at the Entity boundary. */
export type RemoteCard = z.infer<typeof cardSchema>;
/** Browser-persisted Card data owned by a local-mode Deck and therefore intentionally lacking a uid. */
export type LocalCard = z.infer<typeof localCardSchema>;
/** Entity read model spanning both persistence modes; mutations route through the owning Deck. */
export type Card = RemoteCard | LocalCard;
export type CardCreate = z.infer<typeof cardCreateSchema>;
export type CardCreateInput = z.input<typeof cardCreateSchema>;
export type LocalCardCreateInput = z.input<typeof localCardCreateSchema>;
export type CardId = z.infer<typeof cardIdSchema>;
export type CardEdit = z.infer<typeof cardEditSchema>;
export type LocalCardEdit = z.infer<typeof localCardEditSchema>;
export type CardEditInput = LocalCardEdit;
export type CardRaw = Pick<Card, "frontText" | "backText" | "uniqueKey" | "tags">;
export type EditCardInput = z.infer<typeof editCardSchema>;
export type DeleteCardInput = z.infer<typeof deleteCardSchema>;
