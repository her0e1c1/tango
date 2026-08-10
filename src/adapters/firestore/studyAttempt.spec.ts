/** @file Verifies bounded and append-only StudyAttempt Firestore access. */

import { readFileSync } from "node:fs";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  MAX_STUDY_ATTEMPT_QUERY_LIMIT,
  createStudyAttempt,
  readStudyAttempts,
} from "@/adapters/firestore/studyAttempt";
import { buildStudyAttemptCreateDto } from "@/adapters/firestore/studyAttemptDto";
import type { StudyAttemptRange } from "@/domain/studyHistory";
import { createStudyAttempt as createAttempt } from "@/test/factories";

describe("StudyAttempt Firestore adapter", () => {
  let testEnv: RulesTestEnvironment;
  let db: Firestore;
  const baseTime = Date.UTC(2026, 7, 10);

  const range = (overrides: Partial<StudyAttemptRange> = {}): StudyAttemptRange => ({
    fromInclusive: baseTime,
    toExclusive: baseTime + 10_000,
    limit: MAX_STUDY_ATTEMPT_QUERY_LIMIT,
    ...overrides,
  });

  const seed = async (collectionName: string, id: string, data: object) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), collectionName, id), data);
    });
  };

  const seedDependencies = async (uid = "uid", deckId = "deck-id", cardId = "card-id") => {
    await seed("deck", deckId, { uid });
    await seed("card", cardId, { uid, deckId });
  };

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "test-study-attempt",
      firestore: {
        rules: readFileSync("./firestore.rules", "utf8"),
        host: import.meta.env.VITE_DB_HOST,
        port: Number.parseInt(import.meta.env.VITE_DB_PORT, 10),
      },
    });
    db = testEnv.authenticatedContext("uid").firestore() as unknown as Firestore;
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("creates an attempt at its ID and reads it back", async () => {
    await seedDependencies();
    const attempt = createAttempt({ id: "attempt-1", uid: "uid", answeredAt: baseTime, localDate: "2026-08-10" });

    await createStudyAttempt(attempt, db);

    expect((await getDoc(doc(db, "studyAttempt", attempt.id))).data()).toEqual(buildStudyAttemptCreateDto(attempt));
    await expect(readStudyAttempts("uid", range(), db)).resolves.toEqual([attempt]);
  });

  it("accepts an exact retry without duplication and rejects conflicting content", async () => {
    await seedDependencies();
    const attempt = createAttempt({ id: "attempt-1", uid: "uid", answeredAt: baseTime, localDate: "2026-08-10" });
    await createStudyAttempt(attempt, db);

    await expect(createStudyAttempt(attempt, db)).resolves.toBeUndefined();
    await expect(createStudyAttempt({ ...attempt, outcome: "notMastered" }, db)).rejects.toMatchObject({
      code: "permission-denied",
    });
    await expect(readStudyAttempts("uid", range(), db)).resolves.toEqual([attempt]);
  });

  it("reads only the UID and half-open range in descending order with a hard limit", async () => {
    const attempts = [
      createAttempt({ id: "at-start", uid: "uid", answeredAt: baseTime, localDate: "2026-08-10" }),
      createAttempt({ id: "middle", uid: "uid", answeredAt: baseTime + 5_000, localDate: "2026-08-10" }),
      createAttempt({ id: "latest", uid: "uid", answeredAt: baseTime + 9_999, localDate: "2026-08-10" }),
      createAttempt({ id: "at-end", uid: "uid", answeredAt: baseTime + 10_000, localDate: "2026-08-10" }),
      createAttempt({ id: "foreign", uid: "other", answeredAt: baseTime + 7_000, localDate: "2026-08-10" }),
    ];
    for (const attempt of attempts) {
      await seed("studyAttempt", attempt.id, buildStudyAttemptCreateDto(attempt));
    }

    await expect(readStudyAttempts("uid", range({ limit: 2 }), db)).resolves.toEqual([attempts[2], attempts[1]]);
    await expect(readStudyAttempts("uid", range(), db)).resolves.toEqual([attempts[2], attempts[1], attempts[0]]);
  });

  it("orders equal timestamps by document ID descending", async () => {
    const attempts = [
      createAttempt({ id: "tie-a", uid: "uid", answeredAt: baseTime, localDate: "2026-08-10" }),
      createAttempt({ id: "tie-b", uid: "uid", answeredAt: baseTime, localDate: "2026-08-10" }),
    ];
    for (const attempt of attempts) {
      await seed("studyAttempt", attempt.id, buildStudyAttemptCreateDto(attempt));
    }

    await expect(readStudyAttempts("uid", range(), db)).resolves.toEqual([attempts[1], attempts[0]]);
  });

  it.each([
    ["empty UID", "", range()],
    ["non-finite lower bound", "uid", range({ fromInclusive: Number.NaN })],
    ["non-finite upper bound", "uid", range({ toExclusive: Number.POSITIVE_INFINITY })],
    ["empty range", "uid", range({ toExclusive: baseTime })],
    ["reversed range", "uid", range({ toExclusive: baseTime - 1 })],
    ["zero limit", "uid", range({ limit: 0 })],
    ["fractional limit", "uid", range({ limit: 1.5 })],
    ["excessive limit", "uid", range({ limit: MAX_STUDY_ATTEMPT_QUERY_LIMIT + 1 })],
  ])("rejects an invalid %s before using Firestore", async (_name, uid, invalidRange) => {
    await expect(readStudyAttempts(uid, invalidRange, {} as Firestore)).rejects.toMatchObject({
      name: "InvalidStudyAttemptQueryError",
    });
  });

  it("reports the document ID when a stored attempt is malformed", async () => {
    const malformed = createAttempt({
      id: "malformed-attempt",
      uid: "uid",
      answeredAt: baseTime,
      localDate: "2026-08-10",
    });
    await seed("studyAttempt", malformed.id, {
      ...buildStudyAttemptCreateDto(malformed),
      outcome: "unknown",
    });

    await expect(readStudyAttempts("uid", range(), db)).rejects.toMatchObject({
      name: "FirestoreDocumentValidationError",
      collectionName: "studyAttempt",
      documentId: malformed.id,
      message: expect.stringContaining("outcome"),
    });
  });

  it("cannot read another user's attempts", async () => {
    const foreignDb = testEnv.authenticatedContext("other").firestore() as unknown as Firestore;

    await expect(readStudyAttempts("uid", range(), foreignDb)).rejects.toMatchObject({ code: "permission-denied" });
  });
});
