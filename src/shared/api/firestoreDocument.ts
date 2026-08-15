import { z } from "zod";

interface FirestoreTimestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
  toDate: () => Date;
}

const isFirestoreTimestamp = (value: unknown): value is FirestoreTimestamp => {
  if (typeof value !== "object" || value === null) return false;

  // Unknown Firestore-shaped objects may expose throwing accessors, so validation must stay non-throwing.
  try {
    const { seconds, nanoseconds, toDate } = value as Partial<FirestoreTimestamp>;
    return (
      Number.isInteger(seconds) &&
      Number.isInteger(nanoseconds) &&
      nanoseconds !== undefined &&
      nanoseconds >= 0 &&
      nanoseconds < 1_000_000_000 &&
      typeof toDate === "function"
    );
  } catch {
    return false;
  }
};

const javascriptDateSchema = z.date();
const firestoreTimestampSchema = z.custom<FirestoreTimestamp>(isFirestoreTimestamp, "Expected a Firestore Timestamp");

export const firestoreTimestampDateSchema = z
  .union([javascriptDateSchema, firestoreTimestampSchema])
  .transform((value, context) => {
    if (value instanceof Date) return value;
    try {
      return value.toDate();
    } catch {
      context.addIssue({ code: "custom", message: "Invalid Firestore Timestamp" });
      return z.NEVER;
    }
  })
  .pipe(javascriptDateSchema);

type FirestoreDocumentIssues = z.ZodError["issues"];

class FirestoreDocumentValidationError extends Error {
  readonly collectionName: string;
  readonly documentId: string;
  readonly issues: FirestoreDocumentIssues;

  constructor(collectionName: string, documentId: string, issues: FirestoreDocumentIssues) {
    const details = issues
      .map((issue) => `${issue.path.length === 0 ? "<document>" : issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    super(`Invalid Firestore ${collectionName} document "${documentId}": ${details}`);
    this.name = "FirestoreDocumentValidationError";
    this.collectionName = collectionName;
    this.documentId = documentId;
    this.issues = issues;
  }
}

export const parseFirestoreDocument = <T>(
  schema: z.ZodType<T>,
  collectionName: string,
  documentId: string,
  value: unknown
): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new FirestoreDocumentValidationError(collectionName, documentId, result.error.issues);
  }
  return result.data;
};
