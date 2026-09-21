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
  waitForPendingWrites,
  type Firestore,
  type QueryConstraint,
} from "firebase/firestore";
import { replaceAuthSession } from "@/entities/auth";
import { saveStudyOperation as persistStudyOperation } from "@/pages/study-session/model/actions/saveStudyOperation";
import { recordCardStudyProgress } from "@/entities/study-progress";
import type { StudyOperation } from "@/pages/study-session/model/studyOperation";

import { parseCardDocument } from "@/entities/card/api/document";
import { mapStudyProgressDocument } from "@/entities/study-progress/model/dto";
import { editRemoteStudyProgress } from "@/entities/study-progress/api/firestore";
import { editCard } from "@/entities/card/api/firestore";
import { cardStore } from "@/entities/card/model/store";
import { deckStore } from "@/entities/deck/model/store";
import { restoreStudySession } from "@/test/entityFixtures";
import { createCard, createDeck } from "@/test/factories";
import { subscribeWriteErrors } from "@/shared/firestore-write";

const connection = vi.hoisted(() => ({ db: undefined as unknown as Firestore }));
vi.mock("@/shared/firebase", () => ({
  auth: { currentUser: { uid: "answer-owner" } },
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
  const { difficulty, numberOfSeen, schedule } = recordCardStudyProgress(
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
    progress: { difficulty, numberOfSeen, ...(schedule === undefined ? {} : { schedule }) },
    ...overrides,
  };
}
async function saveStudyOperation(input: StudyOperation) {
  const saved = (await getDoc(doc(connection.db, "studySession", input.sessionId))).data();
  const session = {
    sessionId: input.sessionId,
    deckId: input.deckId,
    currentIndex: saved?.currentIndex ?? 0,
    cardOrderIds: cardIds,
    lastStudiedAt: 0,
    remote: { uid: input.uid, startedAt: 1000 },
  };
  restoreStudySession(session);
  let failure: unknown;
  const stop = subscribeWriteErrors((error) => {
    failure = error;
  });
  try {
    const result = await persistStudyOperation(input, session);
    await waitForPendingWrites(connection.db);
    if (failure) throw failure;
    return result;
  } finally {
    stop();
  }
}
const answerData = () => ({
  uid,
  sessionId,
  deckId,
  cardId: cardIds[0],
  answer: { type: "rating", rating: "good" },
  answeredAt: Timestamp.fromMillis(2000),
  createdAt: Timestamp.fromMillis(2000),
  updatedAt: Timestamp.fromMillis(2000),
});

describe("StudyAnswer atomic persistence and access", () => {
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
    cardStore.setState({ remoteCards: cardIds.map((id) => createCard({ id, deckId, uid })) });
    deckStore.setState({ remoteDecks: [createDeck({ id: deckId, uid })] });
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
    "[FIRESTORE-STUDY-ANSWER-01] records %s with progress and one advance",
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
        schedule: input.progress.schedule,
      });
      expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(1);
    }
  );

  it("[FIRESTORE-STUDY-ANSWER-02] rejects stale positions without another answer", async () => {
    const input = operation();
    await saveStudyOperation(input);
    await expect(saveStudyOperation(input)).rejects.toThrow("session does not match");
    expect((await answers()).size).toBe(1);
    expect((await getDoc(doc(connection.db, "card", input.cardId))).data()?.numberOfSeen).toBe(1);
  });

  it("[FIRESTORE-STUDY-ANSWER-03] persists accepted progress despite concurrent changes", async () => {
    const input = operation();
    await updateDoc(doc(connection.db, "card", "card-0"), { numberOfSeen: 20, difficulty: 9 });
    await saveStudyOperation(input);
    expect((await getDoc(doc(connection.db, "card", "card-0"))).data()).toMatchObject({
      numberOfSeen: 1,
      difficulty: 4,
    });
  });

  it("[FIRESTORE-STUDY-ANSWER-04] records ten answers and completes", async () => {
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
    expect((await answers()).size).toBe(10);
  });

  it("[FIRESTORE-STUDY-ANSWER-05] preserves answers across abandonment and restart", async () => {
    const first = operation();
    await saveStudyOperation(first);
    await updateDoc(doc(connection.db, "studySession", sessionId), {
      endReason: "abandoned",
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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

  it("[FIRESTORE-STUDY-ANSWER-06] skips with progress but no answer", async () => {
    await saveStudyOperation(operation({ rating: undefined }));
    expect((await answers()).size).toBe(0);
    expect((await getDoc(doc(connection.db, "card", "card-0"))).data()).toMatchObject({
      difficulty: 5,
      numberOfSeen: 1,
    });
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(1);
    await expect(saveStudyOperation(operation())).rejects.toBeDefined();
  });

  it("[FIRESTORE-STUDY-ANSWER-07] completes a final skip without an answer", async () => {
    await updateDoc(doc(connection.db, "studySession", sessionId), { currentIndex: 9 });
    const input = operation({ cardId: "card-9", currentIndex: 9, rating: undefined });
    await saveStudyOperation(input);
    expect((await answers()).size).toBe(0);
    expect((await getDoc(doc(connection.db, "card", "card-9"))).data()?.numberOfSeen).toBe(1);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.endReason).toBe("completed");
  });

  it("[FIRESTORE-STUDY-ANSWER-08] saves despite an offline browser flag", async () => {
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    try {
      await saveStudyOperation(operation());
    } finally {
      online.mockRestore();
    }
    expect((await answers()).size).toBe(1);
  });

  it("[FIRESTORE-STUDY-ANSWER-09] rejects missing sessions and changed authentication", async () => {
    await expect(saveStudyOperation(operation({ sessionId: "not-saved" }))).rejects.toBeDefined();
    replaceAuthSession({ status: "authenticated", uid: "other-user", isAnonymous: false, displayName: null });
    await expect(saveStudyOperation(operation())).rejects.toThrow("user changed");
    expect((await answers()).size).toBe(0);
    expect((await getDoc(doc(connection.db, "card", "card-0"))).data()?.numberOfSeen).toBe(0);
  });

  it("[FIRESTORE-STUDY-ANSWER-10] retries denied writes without partial progress", async () => {
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

  it.each(["sessionId", "cardId", "deckId"] as const)("[FIRESTORE-STUDY-ANSWER-11] queries by %s", async (field) => {
    const input = operation();
    await saveStudyOperation(input);
    const constraints: QueryConstraint[] = [where("uid", "==", uid), where(field, "==", input[field])];
    if (field !== "sessionId") constraints.push(orderBy("answeredAt", "desc"));
    const result = await assertSucceeds(getDocs(query(collection(connection.db, "studyAnswer"), ...constraints)));
    expect(result.docs.map(({ id }) => id)).toEqual([input.id]);
    await assertFails(getDocs(query(collection(connection.db, "studyAnswer"), where(field, "==", input[field]))));
  });

  it("[FIRESTORE-STUDY-ANSWER-12] rejects an answer owned by another UID", async () => {
    await assertFails(setDoc(doc(collection(connection.db, "studyAnswer")), { ...answerData(), uid: "other" }));
    expect((await answers()).size).toBe(0);
  });

  it("[FIRESTORE-STUDY-ANSWER-13] leaves payload and references to the application", async () => {
    const reference = doc(collection(connection.db, "studyAnswer"));
    const data = { uid, sessionId: "missing", cardId: "missing", answer: { type: "text", text: "custom" } };
    await assertSucceeds(setDoc(reference, data));
    expect((await getDoc(reference)).data()).toEqual(data);
  });

  it("[FIRESTORE-STUDY-ANSWER-14] allows standalone answers without transitions", async () => {
    await assertSucceeds(setDoc(doc(collection(connection.db, "studyAnswer")), answerData()));
    expect((await answers()).size).toBe(1);
    expect((await getDoc(doc(connection.db, "card", "card-0"))).data()?.numberOfSeen).toBe(0);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(0);
  });

  it.each([
    { rating: "again" as const, difficulty: 10 },
    { rating: "easy" as const, difficulty: 1 },
  ])("[FIRESTORE-STUDY-ANSWER-15] preserves difficulty bounds for $rating", async ({ rating, difficulty }) => {
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

  it("[FIRESTORE-STUDY-ANSWER-16] restricts session ownership, not transitions", async () => {
    const reference = doc(connection.db, "studySession", sessionId);
    await assertFails(updateDoc(reference, { uid: "other" }));
    await assertSucceeds(updateDoc(reference, { currentIndex: 1, endReason: "completed" }));
    await assertSucceeds(updateDoc(reference, { currentIndex: 0, endReason: null }));
    const otherDb = environment.authenticatedContext("other", linkedToken).firestore();
    await assertFails(updateDoc(doc(otherDb, "studySession", sessionId), { currentIndex: 1 }));
    await assertFails(deleteDoc(reference));
  });

  it("[FIRESTORE-STUDY-ANSWER-17] denies answer updates, overwrites and deletion", async () => {
    const input = operation();
    await saveStudyOperation(input);
    const reference = doc(connection.db, "studyAnswer", input.id);
    await assertFails(updateDoc(reference, { answer: { type: "rating", rating: "again" } }));
    await assertFails(setDoc(reference, answerData()));
    await assertFails(deleteDoc(reference));
  });

  it("[FIRESTORE-STUDY-ANSWER-18] denies reading missing answer IDs", async () => {
    await assertFails(getDoc(doc(connection.db, "studyAnswer", "missing-answer")));
  });

  it.each(["other-user", "anonymous", "unauthenticated"])("[FIRESTORE-STUDY-ANSWER-19] denies %s", async (actor) => {
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
  it("[FIRESTORE-STUDY-ANSWER-20] restores FSRS and preserves it across partial edits and skip", async () => {
    const reference = doc(connection.db, "card", "card-0");
    await setDoc(reference, {
      ...createCard({ id: "card-0", uid, deckId }),
      nextSeeingAt: Timestamp.fromMillis(1000),
      interval: 12,
    });
    const input = operation();
    await saveStudyOperation(input);
    const data = (await getDoc(reference)).data();
    expect(data).not.toHaveProperty("nextSeeingAt");
    expect(data).not.toHaveProperty("interval");
    const restored = mapStudyProgressDocument("card-0", parseCardDocument("card-0", data));
    expect(restored.schedule).toEqual(input.progress.schedule);
    expect(recordCardStudyProgress({ id: "card-0", ...restored }, "good", 602000).schedule).toEqual(
      recordCardStudyProgress(
        {
          id: "card-0",
          difficulty: input.progress.difficulty,
          numberOfSeen: input.progress.numberOfSeen,
          ...(input.progress.schedule === undefined ? {} : { schedule: input.progress.schedule }),
        },
        "good",
        602000
      ).schedule
    );
    await editRemoteStudyProgress(uid, { cardId: "card-0", difficulty: 8 });
    await editCard(uid, { id: "card-0", uid, frontText: "Edited" });
    expect((await getDoc(reference)).data()?.schedule).toEqual(restored.schedule);
    await setDoc(doc(connection.db, "studySession", sessionId), sessionData());
    await saveStudyOperation(operation({ rating: undefined }));
    expect((await getDoc(reference)).data()?.schedule).toEqual(restored.schedule);
    expect((await answers()).size).toBe(1);
    expect(() => parseCardDocument("card-0", { ...data, schedule: { ...restored.schedule, version: 2 } })).toThrow();
    expect(() =>
      parseCardDocument("card-0", { ...data, schedule: { ...restored.schedule, dueAt: "invalid" } })
    ).toThrow();
  });
});
