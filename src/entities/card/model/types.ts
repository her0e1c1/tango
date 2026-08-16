import type { z } from "zod";

import type { StudyProgress } from "@/entities/study-progress/@x/card";

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

export type RemoteCard = z.infer<typeof cardSchema>;
type StudyProgressField = "score" | "numberOfSeen" | "lastSeenAt" | "nextSeeingAt" | "interval";
export type RemoteCardRead = Omit<RemoteCard, StudyProgressField>;
export interface CardRead {
  card: RemoteCardRead;
  progress: StudyProgress;
}
export type CardDocumentFields = Omit<RemoteCardRead, "id">;
export type LocalCard = z.infer<typeof localCardSchema>;
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
