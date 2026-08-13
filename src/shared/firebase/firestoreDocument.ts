import type { Timestamp } from "firebase/firestore";
import { z } from "zod";

const validDateSchema = z.date().refine((value) => !Number.isNaN(value.getTime()), "Invalid date");
const firestoreTimestampSchema = z.custom<Timestamp>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    typeof Reflect.get(value, "toDate") === "function" &&
    Number.isInteger(Reflect.get(value, "seconds")) &&
    Number.isInteger(Reflect.get(value, "nanoseconds")) &&
    Reflect.get(value, "nanoseconds") >= 0 &&
    Reflect.get(value, "nanoseconds") < 1_000_000_000,
  "Expected a Firestore Timestamp"
);

export const firestoreTimestampDateSchema = z
  .union([validDateSchema, firestoreTimestampSchema])
  .transform((value, context) => {
    if (value instanceof Date) return value;
    try {
      const date = value.toDate();
      if (!Number.isNaN(date.getTime())) return date;
    } catch {
      // Report malformed Timestamp implementations through the schema error boundary below.
    }
    context.addIssue({ code: "custom", message: "Invalid Firestore Timestamp" });
    return z.NEVER;
  });

export class FirestoreDocumentValidationError extends Error {
  constructor(
    readonly collectionName: string,
    readonly documentId: string,
    readonly issues: z.core.$ZodIssue[]
  ) {
    const details = issues
      .map((issue) => `${issue.path.length === 0 ? "<document>" : issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    super(`Invalid Firestore ${collectionName} document "${documentId}": ${details}`);
    this.name = "FirestoreDocumentValidationError";
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

export const getTimestamp = (): number => Date.now();

export type OmitUndefined<T extends Record<string, unknown>> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

export const omitUndefined = <T extends Record<string, unknown>>(value: T): OmitUndefined<T> =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as OmitUndefined<T>;
