import {
  calculateFsrsState,
  getCardStudyState,
  subscribeCardStudyStates,
  clearCardStudyStates,
} from "@/entities/card-study-state";
import { cardStudyStateId } from "@/entities/card-study-state/api/id";
import { parseCardStudyState } from "@/entities/card-study-state/api/document";
import fs from "node:fs";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
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
import type { StudyOperation } from "@/pages/study-session/model/studyOperation";

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
  const rating = "rating" in overrides ? overrides.rating : "good";
  const fsrs =
    rating === undefined
      ? undefined
      : calculateFsrsState(
          getCardStudyState(overrides.cardId ?? "card-0")?.fsrs ?? null,
          rating,
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
    ...(fsrs === undefined ? {} : { fsrs }),
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

describe("StudyAnswer atomic persistence and access [STUDY-ACTIONS-01] [STUDY-ACTIONS-02] [STUDY-ACTIONS-03] [STUDY-ACTIONS-05]", () => {
  let environment: RulesTestEnvironment;
  let stopStates: () => void = () => undefined;
  afterEach(() => {
    stopStates();
    clearCardStudyStates();
  });
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
          deletedAt: null,
          updatedAt: 0,
        })
      )
    );
    await setDoc(doc(connection.db, "studySession", sessionId), sessionData());
    // The emulator reset does not clear this client's cache between examples.
    await getDocs(query(collection(connection.db, "cardStudyState"), where("uid", "==", uid)));
    await new Promise<void>((resolve, reject) => {
      stopStates = subscribeCardStudyStates(uid, reject, resolve);
    });
  });
  afterAll(async () => {
    await environment.cleanup();
  });

  const stateReference = (cardId = "card-0") => doc(connection.db, "cardStudyState", cardStudyStateId(uid, cardId));
  const hasState = async (cardId = "card-0") =>
    (await getDocs(query(collection(connection.db, "cardStudyState"), where("uid", "==", uid)))).docs.some(
      (document) => document.data().cardId === cardId
    );
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
      expect((await getDoc(stateReference(input.cardId))).data()).toMatchObject({
        createdAt: input.answeredAt,
        updatedAt: input.answeredAt,
        fsrs: input.fsrs,
      });
      expect((await getDoc(doc(connection.db, "card", input.cardId))).data()?.updatedAt).toBe(0);
      expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(1);
    }
  );

  it("[FIRESTORE-STUDY-ANSWER-02] rejects stale positions without another answer", async () => {
    const input = operation();
    await saveStudyOperation(input);
    await expect(saveStudyOperation(input)).rejects.toThrow("session does not match");
    expect((await answers()).size).toBe(1);
    expect((await getDoc(stateReference(input.cardId))).data()?.fsrs.reps).toBe(1);
  });

  it("[FIRESTORE-STUDY-ANSWER-03] leaves Card content and metadata unchanged when rating", async () => {
    const input = operation();
    await updateDoc(doc(connection.db, "card", input.cardId), { frontText: "Edited", updatedAt: 500 });
    const before = (await getDoc(doc(connection.db, "card", input.cardId))).data();
    await saveStudyOperation(input);
    expect((await getDoc(doc(connection.db, "card", input.cardId))).data()).toEqual(before);
    expect((await getDoc(stateReference())).data()?.createdAt).toBe(input.answeredAt);
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
      })
    );
    expect((await answers()).size).toBe(2);
    expect((await getDoc(stateReference(first.cardId))).data()?.fsrs.reps).toBe(2);
  });

  it("[FIRESTORE-STUDY-ANSWER-06] skips without a state or answer", async () => {
    await saveStudyOperation(operation({ rating: undefined }));
    expect((await answers()).size).toBe(0);
    expect(await hasState()).toBe(false);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(1);
    await expect(saveStudyOperation(operation())).rejects.toBeDefined();
  });

  it("[FIRESTORE-STUDY-ANSWER-07] completes a final skip without an answer", async () => {
    await updateDoc(doc(connection.db, "studySession", sessionId), { currentIndex: 9 });
    const input = operation({ cardId: "card-9", currentIndex: 9, rating: undefined });
    await saveStudyOperation(input);
    expect((await answers()).size).toBe(0);
    expect(await hasState("card-9")).toBe(false);
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
    expect(await hasState()).toBe(false);
  });

  it("[FIRESTORE-STUDY-ANSWER-10] retries denied writes without partial progress", async () => {
    const input = operation();
    await environment.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), "deck", deckId), { uid: "another-owner" });
    });
    await expect(saveStudyOperation(input)).rejects.toBeDefined();
    expect((await answers()).size).toBe(0);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(0);
    expect(await hasState(input.cardId)).toBe(false);
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
    expect(await hasState()).toBe(false);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(0);
  });

  it.each(["again", "hard", "good", "easy"] as const)(
    "[FIRESTORE-STUDY-ANSWER-15] records valid FSRS state for %s",
    async (rating) => {
      const input = operation({ rating });
      await saveStudyOperation(input);
      const saved = parseCardStudyState(stateReference().id, (await getDoc(stateReference())).data());
      expect(saved.fsrs).toEqual(input.fsrs);
      expect(saved.fsrs?.reps).toBe(1);
    }
  );

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
  it("[FIRESTORE-STUDY-ANSWER-20] restores FSRS and preserves it across content edits and skip", async () => {
    const reference = doc(connection.db, "card", "card-0");
    await setDoc(reference, createCard({ id: "card-0", uid, deckId }));
    const input = operation();
    await saveStudyOperation(input);
    const data = (await getDoc(stateReference())).data();
    const restored = parseCardStudyState(stateReference().id, data);
    expect(restored.fsrs).toEqual(input.fsrs);
    expect(calculateFsrsState(restored.fsrs, "good", 602_000)).toEqual(
      calculateFsrsState(input.fsrs ?? null, "good", 602_000)
    );
    await editCard(uid, { id: "card-0", uid, frontText: "Edited" });
    await setDoc(doc(connection.db, "studySession", sessionId), sessionData());
    await saveStudyOperation(operation({ rating: undefined }));
    expect((await getDoc(stateReference())).data()).toEqual(data);
    expect((await answers()).size).toBe(1);
    expect(() => parseCardStudyState(stateReference().id, { ...data, schemaVersion: 2 })).toThrow();
    await setDoc(doc(connection.db, "studySession", sessionId), sessionData());
    await saveStudyOperation(operation({ answeredAt: 602_000 }));
    expect((await getDoc(stateReference())).data()).toMatchObject({
      createdAt: 2000,
      updatedAt: 602_000,
      fsrs: { reps: 2 },
    });
  });
});
