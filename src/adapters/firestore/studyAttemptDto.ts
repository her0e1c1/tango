/** @file Maps the version 1 StudyAttempt contract to and from Firestore documents. */

import { Timestamp } from "firebase/firestore";
import { z } from "zod";

import { FirestoreDocumentValidationError } from "@/adapters/firestore/dto";
import type { StudyAttempt, StudyOutcome } from "@/domain/studyHistory";

const earliestStudyTime = Date.UTC(2000, 0, 1);
const nonEmptyIdSchema = z.string().refine((value) => value.trim().length > 0, "Expected a non-empty ID");
const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const studyOutcomeSchema = z.enum(["mastered", "notMastered"] satisfies StudyOutcome[]);
const answeredAtSchema = z
  .number()
  .refine(Number.isSafeInteger, "Expected a safe integer timestamp")
  .min(earliestStudyTime, "Timestamp must not be before 2000-01-01");
const firestoreTimestampSchema = z
  .custom<Timestamp>(
    (value) =>
      typeof value === "object" &&
      value !== null &&
      typeof Reflect.get(value, "toMillis") === "function" &&
      Number.isInteger(Reflect.get(value, "seconds")) &&
      Number.isInteger(Reflect.get(value, "nanoseconds")) &&
      Reflect.get(value, "nanoseconds") >= 0 &&
      Reflect.get(value, "nanoseconds") < 1_000_000_000,
    "Expected a Firestore Timestamp"
  )
  .refine((value) => Number.isSafeInteger(value.toMillis()), "Expected a millisecond Timestamp")
  .refine((value) => value.toMillis() >= earliestStudyTime, "Timestamp must not be before 2000-01-01");

const localDateAt = (answeredAt: number, timeZone: string): string | undefined => {
  if (!/^[A-Za-z]/.test(timeZone)) return undefined;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      calendar: "gregory",
      numberingSystem: "latn",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(answeredAt));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    if (values.year === undefined || values.month === undefined || values.day === undefined) return undefined;
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return undefined;
  }
};

const validateTimeContext = (
  value: { answeredAt: number; localDate: string; timeZone: string },
  context: z.RefinementCtx
) => {
  const expectedLocalDate = localDateAt(value.answeredAt, value.timeZone);
  if (expectedLocalDate === undefined) {
    context.addIssue({ code: "custom", path: ["timeZone"], message: "Expected a valid IANA time zone" });
  } else if (value.localDate !== expectedLocalDate) {
    context.addIssue({
      code: "custom",
      path: ["localDate"],
      message: `Expected ${expectedLocalDate} for answeredAt in ${value.timeZone}`,
    });
  }
};

const studyAttemptSchema: z.ZodType<StudyAttempt> = z
  .strictObject({
    id: nonEmptyIdSchema,
    uid: nonEmptyIdSchema,
    sessionId: nonEmptyIdSchema,
    deckId: nonEmptyIdSchema,
    cardId: nonEmptyIdSchema,
    outcome: studyOutcomeSchema,
    answeredAt: answeredAtSchema,
    localDate: localDateSchema,
    timeZone: z.string().min(1),
    schemaVersion: z.literal(1),
  })
  .superRefine(validateTimeContext);

export interface StudyAttemptDocumentV1 {
  uid: string;
  sessionId: string;
  deckId: string;
  cardId: string;
  outcome: StudyOutcome;
  answeredAt: Timestamp;
  localDate: string;
  timeZone: string;
  schemaVersion: 1;
}

const studyAttemptDocumentSchema: z.ZodType<StudyAttemptDocumentV1> = z
  .strictObject({
    uid: nonEmptyIdSchema,
    sessionId: nonEmptyIdSchema,
    deckId: nonEmptyIdSchema,
    cardId: nonEmptyIdSchema,
    outcome: studyOutcomeSchema,
    answeredAt: firestoreTimestampSchema,
    localDate: localDateSchema,
    timeZone: z.string().min(1),
    schemaVersion: z.literal(1),
  })
  .superRefine((value, context) => validateTimeContext({ ...value, answeredAt: value.answeredAt.toMillis() }, context));

const storedStudyAttemptSchema = z.strictObject({
  id: nonEmptyIdSchema,
  document: studyAttemptDocumentSchema,
});

export const buildStudyAttemptCreateDto = (attempt: StudyAttempt): StudyAttemptDocumentV1 => {
  const parsed = studyAttemptSchema.parse(attempt);
  return {
    uid: parsed.uid,
    sessionId: parsed.sessionId,
    deckId: parsed.deckId,
    cardId: parsed.cardId,
    outcome: parsed.outcome,
    answeredAt: Timestamp.fromMillis(parsed.answeredAt),
    localDate: parsed.localDate,
    timeZone: parsed.timeZone,
    schemaVersion: parsed.schemaVersion,
  };
};

export const mapStudyAttemptDocument = (id: string, value: unknown): StudyAttempt => {
  const result = storedStudyAttemptSchema.safeParse({ id, document: value });
  if (!result.success) {
    throw new FirestoreDocumentValidationError("studyAttempt", id, result.error.issues);
  }
  const { document } = result.data;
  return {
    id: result.data.id,
    uid: document.uid,
    sessionId: document.sessionId,
    deckId: document.deckId,
    cardId: document.cardId,
    outcome: document.outcome,
    answeredAt: document.answeredAt.toMillis(),
    localDate: document.localDate,
    timeZone: document.timeZone,
    schemaVersion: document.schemaVersion,
  };
};
