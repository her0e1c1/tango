import { doc, type Transaction } from "firebase/firestore";
import { z } from "zod";
import { db } from "@/shared/firebase";
import { difficultySchema } from "../model/difficulty";
import { studyProgressEditSchema } from "../model/schema";
import type { StudyProgressEdit } from "../model/types";

const progressDocumentSchema = z.object({
  uid: z.string().min(1),
  deckId: z.string().min(1),
  deletedAt: z.number().nullable(),
  difficulty: difficultySchema,
  numberOfSeen: z.number().int().nonnegative(),
});

export async function readStudyProgress(transaction: Transaction, cardId: string) {
  const snapshot = await transaction.get(doc(db, "card", cardId));
  return { id: cardId, ...progressDocumentSchema.parse(snapshot.data()) };
}

export function writeStudyProgress(transaction: Transaction, progress: StudyProgressEdit, updatedAt: number): void {
  const { cardId, ...fields } = studyProgressEditSchema.parse(progress);
  transaction.update(doc(db, "card", cardId), { ...fields, updatedAt });
}
