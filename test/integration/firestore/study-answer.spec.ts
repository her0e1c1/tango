import fs from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
  type QueryConstraint,
} from "firebase/firestore";
import { replaceAuthSession } from "@/entities/auth";
import { saveStudyOperation as persistStudyOperation } from "@/pages/study-session/api/saveStudyOperation";
import { recordCardStudyProgress } from "@/entities/study-progress";
import type { StudyOperation } from "@/pages/study-session/model/studyOperation";

const connection = vi.hoisted(() => ({ db: undefined as unknown as Firestore }));
vi.mock("@/shared/firebase", () => ({
  get db() {
    return connection.db;
  },
}));

const uid = "answer-owner";
const sessionId = "session";
const deckId = "deck";
const cardIds = Array.from({ length: 10 }, (_, index) => `card-${String(index)}`);
const linkedToken = { firebase: { sign_in_provider: "google.com", identities: {} } } as const;
const sessionData = () => ({
  uid,
  deckId,
  cardOrderIds: cardIds,
  currentIndex: 0,
  startedAt: Timestamp.fromMillis(1000),
  endedAt: null,
  endReason: null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
function operation(overrides: Partial<StudyOperation> = {}): StudyOperation {
  const { difficulty, numberOfSeen } = recordCardStudyProgress(
    { id: overrides.cardId ?? "card-0", difficulty: 5, numberOfSeen: 0 },
    "rating" in overrides ? overrides.rating : "good",
    overrides.answeredAt ?? 2000
  );
  return {
    id: crypto.randomUUID(),
    uid,
    sessionId,
    deckId,
    cardId: "card-0",
    currentIndex: 0,
    cardCount: cardIds.length,
    answeredAt: 2000,
    rating: "good",
    progress: { difficulty, numberOfSeen },
    ...overrides,
  };
}
function saveStudyOperation(input: StudyOperation) {
  return persistStudyOperation(input, {
    sessionId: input.sessionId,
    deckId: input.deckId,
    currentIndex: input.currentIndex,
    cardOrderIds: cardIds,
    lastStudiedAt: 0,
    remote: { uid: input.uid, startedAt: 1000 },
  });
}
const answerData = () => ({
  uid,
  sessionId,
  deckId,
  cardId: cardIds[0],
  answer: { type: "rating", rating: "good" },
  answeredAt: Timestamp.fromMillis(2000),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

describe("StudyAnswer atomic persistence and access [SWIPE-02] [SWIPE-03] [SWIPE-04] [SWIPE-08] [SWIPE-09] [SWIPE-10] [SWIPE-12] [PERSIST-01] [PERSIST-04]", () => {
  let environment: RulesTestEnvironment;
  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId: "test-study-answer",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8"),
        host: import.meta.env.VITE_DB_HOST,
        port: Number(import.meta.env.VITE_DB_PORT),
      },
    });
    connection.db = environment.authenticatedContext(uid, linkedToken).firestore() as unknown as Firestore;
  });
  beforeEach(async () => {
    await environment.clearFirestore();
    replaceAuthSession({ status: "authenticated", uid, isAnonymous: false, displayName: null });
    await setDoc(doc(connection.db, "deck", deckId), { uid, isPublic: true });
    await Promise.all(
      cardIds.map((id) =>
        setDoc(doc(connection.db, "card", id), {
          uid,
          deckId,
          difficulty: 5,
          numberOfSeen: 0,
          deletedAt: null,
          updatedAt: 0,
        })
      )
    );
    await setDoc(doc(connection.db, "studySession", sessionId), sessionData());
  });
  afterAll(async () => {
    await environment.cleanup();
  });

  const answers = () => getDocs(query(collection(connection.db, "studyAnswer"), where("uid", "==", uid)));

  it.each(["again", "hard", "good", "easy"] as const)(
    "records %s unchanged with one progress update and one advance",
    async (rating) => {
      const input = operation({ rating });
      const result = await saveStudyOperation(input);
      expect(result.session.currentIndex).toBe(1);
      const answer = (await getDoc(doc(connection.db, "studyAnswer", input.id))).data();
      expect(answer).toEqual({
        uid,
        sessionId,
        deckId,
        cardId: input.cardId,
        answer: { type: "rating", rating },
        answeredAt: Timestamp.fromMillis(input.answeredAt),
        createdAt: expect.any(Timestamp),
        updatedAt: expect.any(Timestamp),
      });
      expect(answer?.createdAt).toEqual(answer?.updatedAt);
      expect((await getDoc(doc(connection.db, "card", input.cardId))).data()).toMatchObject({
        difficulty: rating === "again" ? 6 : 4,
        numberOfSeen: 1,
        lastSeenAt: input.answeredAt,
      });
      expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(1);
    }
  );

  it("preserves answer metadata, progress and cursor when an acknowledged operation is sent again", async () => {
    const input = operation();
    await saveStudyOperation(input);
    const before = await Promise.all([
      getDoc(doc(connection.db, "studyAnswer", input.id)),
      getDoc(doc(connection.db, "card", input.cardId)),
      getDoc(doc(connection.db, "studySession", sessionId)),
    ]);
    await saveStudyOperation(input);
    const after = await Promise.all(before.map((snapshot) => getDoc(snapshot.ref)));
    expect(after.map((snapshot) => snapshot.data())).toEqual(before.map((snapshot) => snapshot.data()));
    await expect(saveStudyOperation({ ...input, rating: "again" })).rejects.toThrow("different contents");
    expect((await answers()).size).toBe(1);
  });

  it("uses accepted progress without rereading concurrent Card changes", async () => {
    const input = operation();
    await updateDoc(doc(connection.db, "card", "card-0"), { numberOfSeen: 20, difficulty: 9 });
    await saveStudyOperation(input);
    expect((await getDoc(doc(connection.db, "card", "card-0"))).data()).toMatchObject({
      numberOfSeen: 1,
      difficulty: 4,
    });
  });

  it("records ten answers, completes atomically and accepts a final acknowledgement retry", async () => {
    let final = operation();
    for (const [index, cardId] of cardIds.entries()) {
      final = operation({ cardId, currentIndex: index, answeredAt: 2000 + index });
      await saveStudyOperation(final);
    }
    expect((await answers()).size).toBe(10);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()).toMatchObject({
      currentIndex: 9,
      endReason: "completed",
      endedAt: expect.any(Timestamp),
    });
    await saveStudyOperation(final);
    await expect(saveStudyOperation({ ...final, id: crypto.randomUUID() })).rejects.toBeDefined();
    expect((await answers()).size).toBe(10);
  });

  it("keeps saved answers after abandonment and records the same card in a new session", async () => {
    const first = operation();
    await saveStudyOperation(first);
    await updateDoc(doc(connection.db, "studySession", sessionId), {
      endReason: "abandoned",
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await saveStudyOperation(first);
    const nextSessionId = "next-session";
    await setDoc(doc(connection.db, "studySession", nextSessionId), sessionData());
    await saveStudyOperation(
      operation({
        sessionId: nextSessionId,
        progress: { difficulty: 3, numberOfSeen: 2 },
      })
    );
    expect((await answers()).size).toBe(2);
    expect((await getDoc(doc(connection.db, "card", first.cardId))).data()?.numberOfSeen).toBe(2);
  });

  it("advances a skip with progress without creating an answer", async () => {
    await saveStudyOperation(operation({ rating: undefined }));
    expect((await answers()).size).toBe(0);
    expect((await getDoc(doc(connection.db, "card", "card-0"))).data()).toMatchObject({
      difficulty: 5,
      numberOfSeen: 1,
    });
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(1);
    await expect(saveStudyOperation(operation())).rejects.toBeDefined();
  });

  it("confirms a final skip retry without recounting progress", async () => {
    await updateDoc(doc(connection.db, "studySession", sessionId), { currentIndex: 9 });
    const input = operation({ cardId: "card-9", currentIndex: 9, rating: undefined });
    await saveStudyOperation(input);
    const before = (await getDoc(doc(connection.db, "studySession", sessionId))).data();
    await saveStudyOperation(input);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()).toEqual(before);
    expect((await answers()).size).toBe(0);
    expect((await getDoc(doc(connection.db, "card", "card-9"))).data()?.numberOfSeen).toBe(1);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.endReason).toBe("completed");
  });

  it("saves when the backend is reachable even if the browser reports offline", async () => {
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    try {
      await saveStudyOperation(operation());
    } finally {
      online.mockRestore();
    }
    expect((await answers()).size).toBe(1);
  });

  it("rejects a missing session and a changed authentication scope without partial writes", async () => {
    await expect(saveStudyOperation(operation({ sessionId: "not-saved" }))).rejects.toBeDefined();
    replaceAuthSession({ status: "authenticated", uid: "other-user", isAnonymous: false, displayName: null });
    await expect(saveStudyOperation(operation())).rejects.toThrow("user changed");
    expect((await answers()).size).toBe(0);
    expect((await getDoc(doc(connection.db, "card", "card-0"))).data()?.numberOfSeen).toBe(0);
  });

  it("retries the same accepted operation after a denied write without partial progress", async () => {
    const input = operation();
    await environment.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), "deck", deckId), { uid: "another-owner" });
    });
    await expect(saveStudyOperation(input)).rejects.toBeDefined();
    expect((await answers()).size).toBe(0);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(0);
    expect((await getDoc(doc(connection.db, "card", input.cardId))).data()?.numberOfSeen).toBe(0);
    await environment.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), "deck", deckId), { uid });
    });
    await saveStudyOperation(input);
    expect((await getDoc(doc(connection.db, "studyAnswer", input.id))).data()?.answeredAt).toEqual(
      Timestamp.fromMillis(2000)
    );
  });

  it.each(["sessionId", "cardId", "deckId"] as const)("queries only the owner's answers by %s", async (field) => {
    const input = operation();
    await saveStudyOperation(input);
    const constraints: QueryConstraint[] = [where("uid", "==", uid), where(field, "==", input[field])];
    if (field !== "sessionId") constraints.push(orderBy("answeredAt", "desc"));
    const result = await assertSucceeds(getDocs(query(collection(connection.db, "studyAnswer"), ...constraints)));
    expect(result.docs.map(({ id }) => id)).toEqual([input.id]);
    await assertFails(getDocs(query(collection(connection.db, "studyAnswer"), where(field, "==", input[field]))));
  });

  it.each([
    "good",
    { type: "rating" },
    { type: "choice", optionId: "a" },
    { type: "rating", rating: "mastered" },
    { type: "rating", rating: "not-mastered" },
    { type: "rating", rating: "unrated" },
    { type: "rating", rating: "invalid" },
    { type: "rating", rating: "good", optionId: "a" },
  ])("rejects an invalid answer payload %j", async (answer) => {
    const batch = writeBatch(connection.db);
    batch.set(doc(collection(connection.db, "studyAnswer")), { ...answerData(), answer });
    batch.update(doc(connection.db, "studySession", sessionId), { currentIndex: 1, updatedAt: serverTimestamp() });
    batch.update(doc(connection.db, "card", "card-0"), { numberOfSeen: 1, difficulty: 4, lastSeenAt: 2000 });
    await assertFails(batch.commit());
    expect((await answers()).size).toBe(0);
  });

  it.each([
    { uid: "other" },
    { deckId: "other" },
    { sessionId: "other" },
    { cardId: cardIds[1] },
    { answeredAt: 2000 },
    { createdAt: Timestamp.fromMillis(0) },
    { updatedAt: Timestamp.fromMillis(0) },
    { isCorrect: null },
    { answerId: "duplicate" },
  ])("rejects invalid references or metadata %j", async (fields) => {
    const batch = writeBatch(connection.db);
    batch.set(doc(collection(connection.db, "studyAnswer")), { ...answerData(), ...fields });
    batch.update(doc(connection.db, "studySession", sessionId), { currentIndex: 1, updatedAt: serverTimestamp() });
    batch.update(doc(connection.db, "card", "card-0"), { numberOfSeen: 1, difficulty: 4, lastSeenAt: 2000 });
    await assertFails(batch.commit());
  });

  it("allows an owner answer alone without enforcing application transitions", async () => {
    await assertSucceeds(setDoc(doc(collection(connection.db, "studyAnswer")), answerData()));
    expect((await answers()).size).toBe(1);
    expect((await getDoc(doc(connection.db, "card", "card-0"))).data()?.numberOfSeen).toBe(0);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(0);
  });

  it.each([
    { rating: "again" as const, difficulty: 10 },
    { rating: "easy" as const, difficulty: 1 },
  ])("keeps difficulty within its bounds for $rating", async ({ rating, difficulty }) => {
    await updateDoc(doc(connection.db, "card", "card-0"), { difficulty });
    await saveStudyOperation(
      operation({
        rating,
        progress: { difficulty, numberOfSeen: 1 },
      })
    );
    expect((await getDoc(doc(connection.db, "card", "card-0"))).data()).toMatchObject({ difficulty, numberOfSeen: 1 });
    expect((await answers()).size).toBe(1);
  });

  it("prevents rewinding, changing card order, or reopening a session", async () => {
    await saveStudyOperation(operation());
    const reference = doc(connection.db, "studySession", sessionId);
    await assertFails(updateDoc(reference, { currentIndex: 0, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(reference, { cardOrderIds: [...cardIds].reverse(), updatedAt: serverTimestamp() }));
    await updateDoc(reference, { endReason: "abandoned", endedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await assertFails(updateDoc(reference, { endReason: null, endedAt: null, updatedAt: serverTimestamp() }));
  });

  it("denies even the owner's updates and deletion of saved answers", async () => {
    const input = operation();
    await saveStudyOperation(input);
    const reference = doc(connection.db, "studyAnswer", input.id);
    await assertFails(updateDoc(reference, { answer: { type: "rating", rating: "again" } }));
    await assertFails(setDoc(reference, answerData()));
    await assertFails(deleteDoc(reference));
  });

  it("denies reading missing answer IDs", async () => {
    await assertFails(getDoc(doc(connection.db, "studyAnswer", "missing-answer")));
  });

  it.each(["other-user", "anonymous", "unauthenticated"])("denies %s access even for a public deck", async (actor) => {
    const input = operation();
    await saveStudyOperation(input);
    const db = (
      actor === "unauthenticated"
        ? environment.unauthenticatedContext()
        : environment.authenticatedContext(actor === "anonymous" ? uid : actor, {
            firebase: { sign_in_provider: actor === "anonymous" ? "anonymous" : "google.com", identities: {} },
          })
    ).firestore();
    await assertFails(getDoc(doc(db, "studyAnswer", input.id)));
    await assertFails(getDocs(query(collection(db, "studyAnswer"), where("uid", "==", uid))));
    await assertFails(setDoc(doc(collection(db, "studyAnswer")), answerData()));
  });
});
