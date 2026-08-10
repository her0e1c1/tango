import type { Timestamp } from "firebase/firestore";
import { z } from "zod";

const validDateSchema = z.date().refine((value) => !Number.isNaN(value.getTime()), "Invalid date");
const timestampSchema = z.custom<Timestamp>(
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

export const timestampOrDateSchema = z.union([validDateSchema, timestampSchema]).transform((value, context) => {
  if (value instanceof Date) return value;
  try {
    const date = value.toDate();
    if (!Number.isNaN(date.getTime())) return date;
  } catch {
    // Validation below keeps malformed Timestamp-like values inside the DTO boundary.
  }
  context.addIssue({ code: "custom", message: "Invalid Firestore Timestamp" });
  return z.NEVER;
});

export class FirestoreDocumentValidationError extends Error {
  constructor(
    readonly collectionName: "deck" | "card",
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

export const parseDocument = <T>(
  schema: z.ZodType<T>,
  collectionName: "deck" | "card",
  id: string,
  value: unknown
): T => {
  const result = schema.safeParse(value);
  if (!result.success) throw new FirestoreDocumentValidationError(collectionName, id, result.error.issues);
  return result.data;
};

type OmitUndefined<T extends Record<string, unknown>> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

export const omitUndefined = <T extends Record<string, unknown>>(value: T): OmitUndefined<T> =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as OmitUndefined<T>;
