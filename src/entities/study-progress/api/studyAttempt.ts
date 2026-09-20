import { doc, Timestamp, type Transaction } from "firebase/firestore";
import { db } from "@/shared/firebase";
import { studyAttemptSchema, type StudyAttempt } from "../model/schema";

export async function readStudyAttempt(
  transaction: Transaction,
  operationId: string
): Promise<StudyAttempt | undefined> {
  const snapshot = await transaction.get(doc(db, "studyAttempt", operationId));
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  if (!(data.answeredAt instanceof Timestamp) || "operationId" in data || "id" in data)
    throw new Error("Invalid study attempt");
  return studyAttemptSchema.parse({ ...data, operationId: snapshot.id, answeredAt: data.answeredAt.toDate() });
}

// Only the combined operation supplies a transaction; there is no standalone Attempt write.
export function writeStudyAttempt(transaction: Transaction, attempt: StudyAttempt): void {
  const { operationId, answeredAt, ...fields } = studyAttemptSchema.parse(attempt);
  transaction.set(doc(db, "studyAttempt", operationId), { ...fields, answeredAt: Timestamp.fromDate(answeredAt) });
}
