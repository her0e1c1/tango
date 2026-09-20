import { doc, type Transaction } from "firebase/firestore";
import { z } from "zod";
import { db } from "@/shared/firebase";
import { difficultySchema } from "../model/difficulty";
import type { StudyProgress, StudyProgressEdit } from "../model/types";

const progressSchema = z.object({
  difficulty: difficultySchema,
  updatedAt: z.number(),
  numberOfSeen: z.number().int().nonnegative(),
  lastSeenAt: z.number().int().nonnegative().optional(),
});

export async function readStudyTarget(
  transaction: Transaction,
  uid: string,
  deckId: string,
  cardId: string
): Promise<{ progress: StudyProgress; updatedAt: number }> {
  const card = await transaction.get(doc(db, "card", cardId));
  const cardData = card.data();
  if (!cardData || cardData.uid !== uid || cardData.deckId !== deckId || cardData.deletedAt != null) {
    throw new Error("Study target is unavailable");
  }
  const progress = progressSchema.parse(cardData);
  return {
    updatedAt: progress.updatedAt,
    progress: {
      cardId,
      difficulty: progress.difficulty,
      numberOfSeen: progress.numberOfSeen,
      ...(progress.lastSeenAt === undefined ? {} : { lastSeenAt: progress.lastSeenAt }),
    },
  };
}

export function writeStudyProgress(
  transaction: Transaction,
  progress: StudyProgressEdit,
  operationId: string,
  updatedAt: number
): void {
  const { cardId, ...fields } = progress;
  transaction.update(doc(db, "card", cardId), {
    ...fields,
    lastStudyOperationId: operationId,
    updatedAt,
  });
}
