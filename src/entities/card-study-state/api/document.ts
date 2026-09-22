import { z } from "zod";
import { parseFirestoreDocument } from "@/shared/api";
import { fsrsStateSchema, instantSchema } from "../model/schema";
import { cardStudyStateId } from "./id";

export const cardStudyStateDocumentSchema = z
  .object({
    schemaVersion: z.literal(1),
    uid: z.string().min(1),
    cardId: z.string().min(1),
    deckId: z.string().min(1),
    fsrs: fsrsStateSchema.nullable(),
    createdAt: instantSchema,
    updatedAt: instantSchema,
  })
  .strict();
export type CardStudyStateDocument = z.infer<typeof cardStudyStateDocumentSchema>;
export function parseCardStudyState(id: string, value: unknown): CardStudyStateDocument {
  const state = parseFirestoreDocument(cardStudyStateDocumentSchema, "cardStudyState", id, value);
  if (id !== cardStudyStateId(state.uid, state.cardId)) throw new Error("Card study state identity does not match");
  return state;
}
