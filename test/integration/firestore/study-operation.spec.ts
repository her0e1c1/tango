import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, Timestamp, updateDoc, writeBatch, type Firestore } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { StudyAttemptInput } from "@/entities/study-progress";
import { createCard, createDeck } from "@/test/factories";

type RecordStudy = typeof import("@/pages/study-session/api/recordStudy").recordStudy;
let environment: RulesTestEnvironment;
let first: { db: Firestore; record: RecordStudy };
let second: { db: Firestore; record: RecordStudy };
let foreign: { db: Firestore; record: RecordStudy };
let deckId: string;
let cardId: string;
const uid = "study-owner";

async function createClient(actor: string) {
  const database = environment.authenticatedContext(actor).firestore() as unknown as Firestore;
  vi.resetModules();
  vi.doMock("@/shared/firebase", () => ({ db: database, auth: { currentUser: { uid: actor } } }));
  return { db: database, record: (await import("@/pages/study-session/api/recordStudy")).recordStudy };
}

// The emulator can report PERMISSION_DENIED instead of ABORTED for a losing optimistic
// commit. Model the UI's explicit same-input retry after every original request has settled;
// production never automatically reissues a transaction after a terminal error.
async function submitConcurrently(operations: { client: typeof first; input: StudyAttemptInput }[]) {
  const results = await Promise.allSettled(operations.map(({ client, input }) => client.record(uid, input, false)));
  const confirmations: ("committed" | "already-committed")[] = [];
  for (const [index, result] of results.entries()) {
    if (result.status === "fulfilled") {
      confirmations.push(result.value);
      continue;
    }
    if (!(result.reason instanceof FirebaseError) || result.reason.code !== "permission-denied") {
      throw new Error("Unexpected concurrent study failure", { cause: result.reason });
    }
    const operation = operations[index];
    if (!operation) throw new Error("Missing accepted operation");
    confirmations.push(await operation.client.record(uid, operation.input, false));
  }
  return confirmations;
}

function createStudyInput(overrides: Partial<StudyAttemptInput> = {}): StudyAttemptInput {
  return {
    operationId: randomUUID(),
    sessionId: "session",
    cardId,
    deckId,
    rating: "good",
    answeredAt: new Date("2026-09-20T10:05:00.000Z"),
    localDate: "2026-09-20",
    timeZone: "UTC",
    schemaVersion: 1,
    ...overrides,
  };
}

async function progress(id = cardId) {
  return (await getDoc(doc(first.db, "card", id))).data();
}
async function attempt(id: string) {
  return (await getDoc(doc(first.db, "studyAttempt", id))).data();
}

async function seedCard(id = cardId, difficulty = 5) {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), "card", id),
      createCard({ id, deckId, uid, difficulty, numberOfSeen: 10, deletedAt: null })
    );
  });
}

describe("recordStudy with real transactions and owner Rules [SWIPE-02] [SWIPE-03] [SWIPE-27] [SWIPE-28]", () => {
  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId: `study-${randomUUID()}`,
      firestore: {
        host: import.meta.env.VITE_DB_HOST,
        port: Number(import.meta.env.VITE_DB_PORT),
        rules: readFileSync("firestore.rules", "utf8"),
      },
    });
    first = await createClient(uid);
    second = await createClient(uid);
    foreign = await createClient("another-owner");
  });
  beforeEach(async () => {
    deckId = randomUUID();
    cardId = randomUUID();
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "deck", deckId), {
        ...createDeck({ id: deckId, uid, localMode: false }),
        deletedAt: null,
      });
    });
    await seedCard();
  });
  afterAll(async () => {
    await environment.cleanup();
    vi.doUnmock("@/shared/firebase");
  });

  it("preserves two clients' concurrent good reviews of the same initial Card", async () => {
    const a = createStudyInput();
    const b = createStudyInput();
    expect(
      await submitConcurrently([
        { client: first, input: a },
        { client: second, input: b },
      ])
    ).toEqual(["committed", "committed"]);
    expect(await progress()).toMatchObject({ difficulty: 3, numberOfSeen: 12, lastSeenAt: a.answeredAt.getTime() });
    expect(await attempt(a.operationId)).toMatchObject({ uid, cardId, rating: "good" });
    expect(await attempt(b.operationId)).toMatchObject({ uid, cardId, rating: "good" });
  });

  it("preserves distinct simultaneous and consecutive operations from one client", async () => {
    const operations = [createStudyInput(), createStudyInput(), createStudyInput()] as const;
    await submitConcurrently(operations.slice(0, 2).map((input) => ({ client: first, input })));
    await first.record(uid, operations[2], false);
    expect(await progress()).toMatchObject({ difficulty: 2, numberOfSeen: 13 });
    for (const operation of operations) expect(await attempt(operation.operationId)).toBeDefined();
  });

  it.each([false, true])("applies mixed ratings in commit order, reverse=%s", async (reverse) => {
    await seedCard(cardId, 1);
    const good = createStudyInput();
    const again = createStudyInput({ rating: "again" });
    await first.record(uid, reverse ? again : good, false);
    await second.record(uid, reverse ? good : again, false);
    expect(await progress()).toMatchObject({ difficulty: reverse ? 1 : 2, numberOfSeen: 12 });
  });

  it("uses the actual commit order when mixed ratings race", async () => {
    await seedCard(cardId, 1);
    const good = createStudyInput();
    const again = createStudyInput({ rating: "again" });
    await submitConcurrently([
      { client: first, input: good },
      { client: second, input: again },
    ]);
    const final = await progress();
    expect(final).toMatchObject({
      numberOfSeen: 12,
      difficulty: final?.lastStudyOperationId === again.operationId ? 2 : 1,
    });
  });

  it("confirms one operation concurrently and after a lost response without applying it again", async () => {
    const operation = createStudyInput();
    const results = await submitConcurrently([
      { client: first, input: operation },
      { client: second, input: operation },
    ]);
    expect(results.toSorted((a, b) => a.localeCompare(b))).toEqual(["already-committed", "committed"]);
    const saved = await progress();
    expect(await first.record(uid, operation, false)).toBe("already-committed");
    expect(await progress()).toEqual(saved);
    expect(await attempt(operation.operationId)).not.toHaveProperty("id");
    expect(await attempt(operation.operationId)).not.toHaveProperty("operationId");
  });

  it.each(["rating", "sessionId", "deckId", "cardId", "answeredAt", "timeZone"] as const)(
    "rejects same-ID conflicting %s",
    async (field) => {
      const operation = createStudyInput();
      await first.record(uid, operation, false);
      const conflicting = {
        ...operation,
        [field]:
          field === "rating"
            ? "again"
            : field === "answeredAt"
              ? new Date("2026-09-20T10:04:00Z")
              : field === "timeZone"
                ? "Europe/London"
                : "other",
      };
      await expect(first.record(uid, conflicting, false)).rejects.toThrow();
      expect(await progress()).toMatchObject({ numberOfSeen: 11 });
    }
  );

  it("retains the answer time while late and equal-time reviews do not reverse the transition clock", async () => {
    const latest = createStudyInput();
    const delayed = createStudyInput({ answeredAt: new Date("2026-09-20T10:03:00Z") });
    const same = createStudyInput();
    await first.record(uid, latest, false);
    await second.record(uid, delayed, false);
    await first.record(uid, same, false);
    expect(await progress()).toMatchObject({ numberOfSeen: 13, lastSeenAt: latest.answeredAt.getTime() });
    expect((await attempt(delayed.operationId))?.answeredAt.toDate()).toEqual(delayed.answeredAt);
  });

  it.each(["hard", "easy"] as const)("accepts the model's %s rating", async (rating) => {
    const operation = createStudyInput({ rating });
    await first.record(uid, operation, false);
    expect(await progress()).toMatchObject({ difficulty: rating === "hard" ? 5 : 4, numberOfSeen: 11 });
    expect(await attempt(operation.operationId)).toMatchObject({ rating });
  });

  it("saves different Cards independently", async () => {
    const other = randomUUID();
    await seedCard(other);
    await Promise.all([
      first.record(uid, createStudyInput(), false),
      first.record(uid, createStudyInput({ cardId: other }), false),
    ]);
    expect(await progress()).toMatchObject({ numberOfSeen: 11 });
    expect(await progress(other)).toMatchObject({ numberOfSeen: 11 });
  });

  it("does not queue or automatically reissue an offline transaction", async () => {
    const operation = createStudyInput();
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    try {
      await expect(first.record(uid, operation, false)).rejects.toThrow();
    } finally {
      online.mockRestore();
    }
    expect(await progress()).toMatchObject({ numberOfSeen: 10 });
    expect(await attempt(operation.operationId)).toBeUndefined();
    await first.record(uid, operation, false);
    expect(await progress()).toMatchObject({ numberOfSeen: 11 });
  }, 20_000);

  it.each(["soft", "physical"])(
    "confirms a retained result after %s target deletion and rejects a new operation",
    async (deletion) => {
      const operation = createStudyInput();
      await first.record(uid, operation, false);
      for (const [collection, id] of [
        ["card", cardId],
        ["deck", deckId],
      ] as const) {
        if (deletion === "soft") await updateDoc(doc(first.db, collection, id), { deletedAt: Date.now() });
        else await deleteDoc(doc(first.db, collection, id));
      }
      expect(await first.record(uid, operation, false)).toBe("already-committed");
      await expect(first.record(uid, createStudyInput(), false)).rejects.toThrow();
      await expect(foreign.record("another-owner", operation, false)).rejects.toThrow();
      expect(await attempt(operation.operationId)).toBeDefined();
    }
  );

  it.each([{ localDate: "2026-09-19" }, { timeZone: "Mars/Unknown" }, { timeZone: "+00:00" }])(
    "rejects invalid reporting metadata before either write: %j",
    async (metadata) => {
      const operation = createStudyInput(metadata);
      await expect(first.record(uid, operation, false)).rejects.toThrow();
      expect(await progress()).toMatchObject({ difficulty: 5, numberOfSeen: 10 });
      expect(await attempt(operation.operationId)).toBeUndefined();
    }
  );

  it("rejects foreign actors and invalid input without partial writes", async () => {
    const operation = createStudyInput();
    await expect(first.record("another-owner", operation, false)).rejects.toThrow();
    await expect(foreign.record("another-owner", operation, false)).rejects.toThrow();
    await expect(
      first.record(uid, { ...operation, schemaVersion: 2 } as unknown as StudyAttemptInput, false)
    ).rejects.toThrow();
    expect(await progress()).toMatchObject({ numberOfSeen: 10 });
    expect(await attempt(operation.operationId)).toBeUndefined();
  });

  it("rejects either half of a review, malformed combined writes, and mutations of a committed Attempt", async () => {
    const operation = createStudyInput();
    const { operationId, ...fields } = operation;
    const data = { ...fields, uid, answeredAt: Timestamp.fromDate(fields.answeredAt) };
    const attemptRef = doc(first.db, "studyAttempt", operationId);
    const cardRef = doc(first.db, "card", cardId);
    await expect(setDoc(attemptRef, data)).rejects.toThrow();
    await expect(
      updateDoc(cardRef, {
        numberOfSeen: 11,
        lastSeenAt: operation.answeredAt.getTime(),
        lastStudyOperationId: operationId,
      })
    ).rejects.toThrow();
    const invalid = writeBatch(first.db);
    invalid.update(cardRef, {
      numberOfSeen: 11,
      lastSeenAt: operation.answeredAt.getTime(),
      lastStudyOperationId: operationId,
    });
    invalid.set(attemptRef, { ...data, id: operationId });
    await expect(invalid.commit()).rejects.toThrow();
    expect(await progress()).toMatchObject({ numberOfSeen: 10 });
    expect(await attempt(operationId)).toBeUndefined();
    await first.record(uid, operation, false);
    await expect(updateDoc(attemptRef, { rating: "again" })).rejects.toThrow();
    await expect(deleteDoc(attemptRef)).rejects.toThrow();
    await expect(getDoc(doc(foreign.db, "studyAttempt", operationId))).rejects.toThrow();
    const anonymous = environment.unauthenticatedContext().firestore();
    await expect(getDoc(doc(anonymous, "studyAttempt", operationId))).rejects.toThrow();
  });
  it("keeps modification time current for a delayed review after a content edit", async () => {
    const updatedAt = Date.now() + 1000;
    await updateDoc(doc(first.db, "card", cardId), { frontText: "edited", updatedAt });
    const operation = createStudyInput({ answeredAt: new Date("2026-09-20T10:03:00Z") });
    await first.record(uid, operation, false);
    expect(await progress()).toMatchObject({
      frontText: "edited",
      updatedAt,
      lastSeenAt: operation.answeredAt.getTime(),
    });
  });
});
