import { calculateFsrsState, getCards, subscribeCards, clearRemoteCards } from "@/entities/card";
import { parseCardDocument } from "@/entities/card/api/document";
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
  setDoc as saveDocument,
  type DocumentReference,
  type DocumentData,
  Timestamp,
  updateDoc as updateDocument,
  where,
  waitForPendingWrites,
  type Firestore,
  type QueryConstraint,
} from "firebase/firestore";
import { replaceAuthSession } from "@/entities/auth";
import { saveStudyOperation as persistStudyOperation } from "@/pages/study-session/model/actions/saveStudyOperation";
import type { StudyOperation } from "@/pages/study-session/model/studyOperation";

import { editCard } from "@/entities/card";
import { cardStore } from "@/entities/card/model/store";
import { deckStore } from "@/entities/deck/model/store";
import { restoreStudySession } from "@/test/utils/entityFixtures";
import { createCard, createDeck } from "@/test/factories";

const connection = vi.hoisted(() => ({ db: undefined as unknown as Firestore }));
vi.mock("@/shared/firebase", async () => ({
  auth: { currentUser: { uid: "answer-owner" } },
  get db() {
    return connection.db;
  },
}));

const setDoc = (reference: DocumentReference, data: DocumentData) =>
  saveDocument(reference, { ...data, updatedAt: serverTimestamp() });
const updateDoc = (reference: DocumentReference, data: DocumentData) =>
  updateDocument(reference, { ...data, updatedAt: serverTimestamp() });

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
  lastStudiedAt: 1000,
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
          getCards().find((card) => card.id === (overrides.cardId ?? "card-0"))?.fsrs ?? null,
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
  const result = await persistStudyOperation(input, session);
  await waitForPendingWrites(connection.db);
  return result;
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

describe("StudyAnswer persistence and access [STUDY-ACTIONS-01] [STUDY-ACTIONS-02] [STUDY-ACTIONS-03] [STUDY-ACTIONS-05 STUDY-ACTIONS-12 STUDY-ACTIONS-14]", () => {
  let environment: RulesTestEnvironment;
  let stopStates: () => void = () => undefined;
  afterEach(() => {
    stopStates();
    clearRemoteCards();
  });
  beforeAll(async () => {
    // Given: Establish the shared setup used by the following cases.
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
    // Given: Establish the shared setup used by the following cases.
    await environment.clearFirestore();
    cardStore.setState({ cardsById: Object.fromEntries(cardIds.map((id) => [id, createCard({ id, deckId, uid })])) });
    deckStore.setState({ remoteDecks: [createDeck({ id: deckId, uid })] });
    replaceAuthSession({ status: "authenticated", uid, isAnonymous: false, displayName: null });
    await setDoc(doc(connection.db, "deck", deckId), { uid, isPublic: true });
    await Promise.all(
      cardIds.map((id) =>
        setDoc(doc(connection.db, "card", id), {
          ...createCard({ id, uid, deckId }),
        })
      )
    );
    await setDoc(doc(connection.db, "studySession", sessionId), sessionData());
    // The emulator reset does not clear this client's cache between examples.
    await getDocs(query(collection(connection.db, "card"), where("uid", "==", uid)));
    await new Promise<void>((resolve, reject) => {
      stopStates = subscribeCards(uid, reject, resolve);
    });
  });
  afterAll(async () => {
    await environment.cleanup();
  });

  const stateReference = (cardId = "card-0") => doc(connection.db, "card", cardId);
  const hasState = async (cardId = "card-0") =>
    (await getDocs(query(collection(connection.db, "card"), where("uid", "==", uid)))).docs.some(
      (document) => document.id === cardId && document.data().fsrs !== null
    );
  const answers = () => getDocs(query(collection(connection.db, "studyAnswer"), where("uid", "==", uid)));

  it.each(["again", "hard", "good", "easy"] as const)(
    "[FIRESTORE-STUDY-ANSWER-01] records %s with progress and one advance",
    async (rating) => {
      // Given: Prepare `input` and any shared test state below.
      const input = operation({ rating });
      // When: Exercise `saveStudyOperation` with the prepared inputs.
      const result = await saveStudyOperation(input);
      // Then: Verify the expected result in the assertions below.
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
      expect(answer?.createdAt).toEqual(answer?.answeredAt);
      expect((await getDoc(stateReference(input.cardId))).data()).toMatchObject({
        createdAt: 0,
        updatedAt: expect.any(Timestamp),
        fsrs: input.fsrs,
      });
      expect((await getDoc(doc(connection.db, "card", input.cardId))).data()?.updatedAt).toBeInstanceOf(Timestamp);
      expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(1);
    }
  );

  it("[FIRESTORE-STUDY-ANSWER-02] rejects stale positions without another answer", async () => {
    // Given: Prepare `input` and any shared test state below.
    const input = operation();
    // When: Exercise `saveStudyOperation` with the prepared inputs.
    await saveStudyOperation(input);
    // Then: Verify the expected result in the assertions below.
    await expect(saveStudyOperation(input)).rejects.toThrow("session does not match");
    expect((await answers()).size).toBe(1);
    expect((await getDoc(stateReference(input.cardId))).data()?.fsrs.reps).toBe(1);
  });

  it("[FIRESTORE-STUDY-ANSWER-03] preserves Card content and creation time when rating", async () => {
    // Given: Prepare `input`, `before` and any shared test state below.
    const input = operation();
    await updateDoc(doc(connection.db, "card", input.cardId), { frontText: "Edited", updatedAt: 500 });
    const before = (await getDoc(doc(connection.db, "card", input.cardId))).data();
    // When: Exercise `saveStudyOperation` with the prepared inputs.
    await saveStudyOperation(input);
    // Then: Verify the expected result in the assertions below.
    expect((await getDoc(doc(connection.db, "card", input.cardId))).data()).toEqual({
      ...before,
      fsrs: input.fsrs,
      updatedAt: expect.any(Timestamp),
    });
    expect((await getDoc(stateReference())).data()?.createdAt).toBe(0);
  });

  it("[FIRESTORE-STUDY-ANSWER-04] records ten answers and completes", async () => {
    // Given: Use this case's inputs and any shared test setup.
    let final = operation();
    for (const [index, cardId] of cardIds.entries()) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      final = operation({ cardId, currentIndex: index, answeredAt: 2000 + index });
      // When: Save the answer prepared for this Card and session position.
      await saveStudyOperation(final);
    }
    // Then: Verify the expected result in the assertions below.
    expect((await answers()).size).toBe(10);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()).toMatchObject({
      currentIndex: 9,
      endReason: "completed",
      endedAt: expect.any(Timestamp),
    });
    expect((await answers()).size).toBe(10);
  });

  it("[FIRESTORE-STUDY-ANSWER-05] preserves answers across abandonment and restart", async () => {
    // Given: Prepare `first` and any shared test state below.
    const first = operation();
    // When: Exercise `saveStudyOperation` with the prepared inputs.
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
    // Then: Verify the expected result in the assertions below.
    expect((await answers()).size).toBe(2);
    expect((await getDoc(stateReference(first.cardId))).data()?.fsrs.reps).toBe(2);
  });

  it("[FIRESTORE-STUDY-ANSWER-06] skips without a state or answer", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `saveStudyOperation` with the prepared inputs.
    await saveStudyOperation(operation({ rating: undefined }));
    // Then: Verify the expected result in the assertions below.
    expect((await answers()).size).toBe(0);
    expect(await hasState()).toBe(false);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(1);
    await expect(saveStudyOperation(operation())).rejects.toBeDefined();
  });

  it("[FIRESTORE-STUDY-ANSWER-07] completes a final skip without an answer", async () => {
    // Given: Prepare `input` and any shared test state below.
    await updateDoc(doc(connection.db, "studySession", sessionId), { currentIndex: 9 });
    const input = operation({ cardId: "card-9", currentIndex: 9, rating: undefined });
    // When: Exercise `saveStudyOperation` with the prepared inputs.
    await saveStudyOperation(input);
    // Then: Verify the expected result in the assertions below.
    expect((await answers()).size).toBe(0);
    expect(await hasState("card-9")).toBe(false);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.endReason).toBe("completed");
  });

  it("[FIRESTORE-STUDY-ANSWER-08] saves despite an offline browser flag", async () => {
    // Given: Prepare `online` and any shared test state below.
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    try {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Exercise `saveStudyOperation` with the prepared inputs.
      await saveStudyOperation(operation());
    } finally {
      online.mockRestore();
    }
    // When: Observe the prepared result through the following checks.
    // Then: Verify the expected result in the assertions below.
    expect((await answers()).size).toBe(1);
  });

  it("[FIRESTORE-STUDY-ANSWER-09] preserves earlier writes when session saving fails and rejects changed authentication", async () => {
    // Given: Prepare `input`, `session` and any shared test state below.
    const input = operation({ sessionId: "not-saved" });
    const session = {
      sessionId: input.sessionId,
      deckId,
      currentIndex: 0,
      cardOrderIds: cardIds,
      lastStudiedAt: 1000,
      remote: { uid, startedAt: 1000 },
    };
    restoreStudySession(session);
    // When: Persist an operation for the locally restored but missing remote session.
    // Then: Report the failure while retaining the successful Card and answer writes.
    await expect(persistStudyOperation(input, session)).rejects.toBeDefined();
    expect((await getDoc(stateReference())).data()?.fsrs).toEqual(input.fsrs);
    expect((await getDoc(doc(connection.db, "studyAnswer", input.id))).data()?.sessionId).toBe("not-saved");
    await environment.withSecurityRulesDisabled(async (context) => {
      expect((await getDoc(doc(context.firestore(), "studySession", "not-saved"))).exists()).toBe(false);
    });
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(0);
    // When: Switch the authenticated owner and attempt the previous owner's operation.
    replaceAuthSession({ status: "authenticated", uid: "other-user", isAnonymous: false, displayName: null });
    // Then: Verify the expected result in the assertions below.
    await expect(saveStudyOperation(operation())).rejects.toThrow("user changed");
    expect((await answers()).size).toBe(1);
    expect(await hasState()).toBe(true);
  });

  it("[FIRESTORE-STUDY-ANSWER-10] keeps the answer and position when the Card write is denied", async () => {
    // Given: Use this case's inputs and any shared test setup.
    const input = operation();
    await environment.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), "deck", deckId), { uid: "another-owner" });
    });
    // When: Save the operation after the parent Deck's owner has changed.
    // Then: Reject the Card write while retaining its answer and advanced session position.
    await expect(saveStudyOperation(input)).rejects.toMatchObject({ code: "permission-denied" });
    expect((await answers()).size).toBe(1);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(1);
    expect(await hasState(input.cardId)).toBe(false);
    // When: Restore the parent owner and retry the same operation.
    await environment.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), "deck", deckId), { uid });
    });
    // Then: Reject its stale session position without adding another answer.
    await expect(saveStudyOperation(input)).rejects.toThrow("session does not match");
    expect((await getDoc(doc(connection.db, "studyAnswer", input.id))).data()?.answeredAt).toEqual(
      Timestamp.fromMillis(2000)
    );
  });

  it.each(["sessionId", "cardId", "deckId"] as const)("[FIRESTORE-STUDY-ANSWER-11] queries by %s", async (field) => {
    // Given: Prepare `input` and any shared test state below.
    const input = operation();
    await saveStudyOperation(input);
    const constraints: QueryConstraint[] = [where("uid", "==", uid), where(field, "==", input[field])];
    if (field !== "sessionId") constraints.push(orderBy("answeredAt", "desc"));
    // When: Query the saved answer using the owner and this row's indexed field.
    const result = await assertSucceeds(getDocs(query(collection(connection.db, "studyAnswer"), ...constraints)));
    // Then: Verify the expected result in the assertions below.
    expect(result.docs.map(({ id }) => id)).toEqual([input.id]);
    // When: Attempt the same field query without its required owner constraint.
    // Then: Verify the expected result in the assertions below.
    await assertFails(getDocs(query(collection(connection.db, "studyAnswer"), where(field, "==", input[field]))));
  });

  it("[FIRESTORE-STUDY-ANSWER-12] rejects an answer owned by another UID", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `setDoc` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertFails(setDoc(doc(collection(connection.db, "studyAnswer")), { ...answerData(), uid: "other" }));
    expect((await answers()).size).toBe(0);
  });

  it("[FIRESTORE-STUDY-ANSWER-13] leaves payload and references to the application", async () => {
    // Given: Prepare `reference`, `data` and any shared test state below.
    const reference = doc(collection(connection.db, "studyAnswer"));
    const data = { uid, sessionId: "missing", cardId: "missing", answer: { type: "text", text: "custom" } };
    // When: Evaluate `setDoc` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertSucceeds(setDoc(reference, data));
    expect((await getDoc(reference)).data()).toEqual({ ...data, updatedAt: expect.any(Timestamp) });
  });

  it("[FIRESTORE-STUDY-ANSWER-14] allows standalone answers without transitions", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `setDoc` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertSucceeds(setDoc(doc(collection(connection.db, "studyAnswer")), answerData()));
    expect((await answers()).size).toBe(1);
    expect(await hasState()).toBe(false);
    expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(0);
  });

  it.each(["again", "hard", "good", "easy"] as const)(
    "[FIRESTORE-STUDY-ANSWER-15] records valid FSRS state for %s",
    async (rating) => {
      // Given: Prepare `input` and any shared test state below.
      const input = operation({ rating });
      // When: Exercise `saveStudyOperation` with the prepared inputs.
      await saveStudyOperation(input);
      const saved = parseCardDocument(stateReference().id, (await getDoc(stateReference())).data());
      // Then: Verify the expected result in the assertions below.
      expect(saved.fsrs).toEqual(input.fsrs);
      expect(saved.fsrs?.reps).toBe(1);
    }
  );

  it("[FIRESTORE-STUDY-ANSWER-16] restricts session ownership, not transitions", async () => {
    // Given: Prepare `reference` and any shared test state below.
    const reference = doc(connection.db, "studySession", sessionId);
    // When: Evaluate `updateDoc` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertFails(updateDoc(reference, { uid: "other" }));
    // When: Evaluate `updateDoc` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertSucceeds(updateDoc(reference, { currentIndex: 1, endReason: "completed" }));
    // When: Evaluate `updateDoc` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertSucceeds(updateDoc(reference, { currentIndex: 0, endReason: null }));
    const otherDb = environment.authenticatedContext("other", linkedToken).firestore();
    // When: Evaluate `updateDoc` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertFails(updateDoc(doc(otherDb, "studySession", sessionId), { currentIndex: 1 }));
    // When: Evaluate `deleteDoc` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertFails(deleteDoc(reference));
  });

  it("[FIRESTORE-STUDY-ANSWER-17] denies answer updates, overwrites and deletion", async () => {
    // Given: Prepare `input`, `reference` and any shared test state below.
    const input = operation();
    await saveStudyOperation(input);
    const reference = doc(connection.db, "studyAnswer", input.id);
    // When: Evaluate `updateDoc` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertFails(updateDoc(reference, { answer: { type: "rating", rating: "again" } }));
    // When: Evaluate `setDoc` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertFails(setDoc(reference, answerData()));
    // When: Evaluate `deleteDoc` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertFails(deleteDoc(reference));
  });

  it("[FIRESTORE-STUDY-ANSWER-18] denies reading missing answer IDs", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Observe the prepared result through the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertFails(getDoc(doc(connection.db, "studyAnswer", "missing-answer")));
  });

  it.each(["other-user", "anonymous", "unauthenticated"])("[FIRESTORE-STUDY-ANSWER-19] denies %s", async (actor) => {
    // Given: Prepare `input`, `db` and any shared test state below.
    const input = operation();
    await saveStudyOperation(input);
    const db = (
      actor === "unauthenticated"
        ? environment.unauthenticatedContext()
        : environment.authenticatedContext(actor === "anonymous" ? uid : actor, {
            firebase: { sign_in_provider: actor === "anonymous" ? "anonymous" : "google.com", identities: {} },
          })
    ).firestore();
    // When: Observe the prepared result through the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertFails(getDoc(doc(db, "studyAnswer", input.id)));
    // When: Observe the prepared result through the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertFails(getDocs(query(collection(db, "studyAnswer"), where("uid", "==", uid))));
    // When: Evaluate `setDoc` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await assertFails(setDoc(doc(collection(db, "studyAnswer")), answerData()));
  });
  it("[FIRESTORE-STUDY-ANSWER-20] restores FSRS and preserves it across content edits and skip", async () => {
    // Given: Prepare `reference`, `input` and any shared test state below.
    const reference = doc(connection.db, "card", "card-0");
    await setDoc(reference, createCard({ id: "card-0", uid, deckId }));
    const input = operation();
    // When: Exercise `saveStudyOperation` with the prepared inputs.
    await saveStudyOperation(input);
    const data = (await getDoc(stateReference())).data();
    const restored = parseCardDocument(stateReference().id, data);
    // Then: Verify the expected result in the assertions below.
    expect(restored.fsrs).toEqual(input.fsrs);
    expect(calculateFsrsState(restored.fsrs, "good", 602_000)).toEqual(
      calculateFsrsState(input.fsrs ?? null, "good", 602_000)
    );
    // When: Exercise `editCard` with the prepared inputs.
    await editCard(uid, { id: "card-0", frontText: "Edited" });
    await setDoc(doc(connection.db, "studySession", sessionId), sessionData());
    await saveStudyOperation(operation({ rating: undefined }));
    // Then: Verify the expected result in the assertions below.
    expect((await getDoc(stateReference())).data()?.fsrs).toEqual(data?.fsrs);
    expect((await answers()).size).toBe(1);
    expect(() => parseCardDocument(stateReference().id, { ...data, fsrs: {} })).toThrow();
    // When: Exercise `setDoc` with the prepared inputs.
    await setDoc(doc(connection.db, "studySession", sessionId), sessionData());
    await saveStudyOperation(operation({ answeredAt: 602_000 }));
    // Then: Verify the expected result in the assertions below.
    expect((await getDoc(stateReference())).data()).toMatchObject({
      createdAt: 0,
      updatedAt: expect.any(Timestamp),
      fsrs: { reps: 2 },
    });
  });
  it.each([-1, 0.5, 253_402_300_800_000])(
    "[FIRESTORE-STUDY-ANSWER-21] rejects invalid answer time %s before saving",
    async (answeredAt) => {
      // Given: Use this case's inputs and any shared test setup.
      const input = { ...operation(), answeredAt };
      // When: Attempt to save the operation with this row's invalid answer time.
      // Then: Reject validation before changing the Card, answer collection, or session.
      await expect(saveStudyOperation(input)).rejects.toBeDefined();
      expect((await getDoc(stateReference())).data()?.fsrs).toBeNull();
      expect((await answers()).size).toBe(0);
      expect((await getDoc(doc(connection.db, "studySession", sessionId))).data()?.currentIndex).toBe(0);
    }
  );
});
