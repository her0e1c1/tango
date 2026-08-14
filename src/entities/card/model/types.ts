import type { z } from "zod";

import type {
  cardCreateSchema,
  cardEditSchema,
  cardIdSchema,
  cardSchema,
  deleteCardSchema,
  editCardSchema,
} from "./schema";

export type Card = z.infer<typeof cardSchema>;
export type CardCreate = z.infer<typeof cardCreateSchema>;
export type CardCreateInput = z.input<typeof cardCreateSchema>;
export type CardId = z.infer<typeof cardIdSchema>;
export type CardEdit = z.infer<typeof cardEditSchema>;
export type CardRaw = Pick<Card, "frontText" | "backText" | "uniqueKey" | "tags">;
export type EditCardInput = z.infer<typeof editCardSchema>;
export type DeleteCardInput = z.infer<typeof deleteCardSchema>;
