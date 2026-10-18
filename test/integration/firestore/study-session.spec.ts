import { getStudyFilter } from "@/entities/deck";
import "@/test/initializeTestFirestore";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteApp, getApps } from "firebase/app";
import {
  collection,
  disableNetwork,
  doc,
  enableNetwork,
  getDoc,
  getDocFromCache,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  waitForPendingWrites,
  where,
} from "firebase/firestore";
import { replaceAuthSession } from "@/entities/auth";
import { cardStore } from "@/entities/card/model/store";
import { deckStore } from "@/entities/deck/model/store";
import { preferencesStore } from "@/entities/preference/model/store";
import {
  abandonStudySession,
  clearStudySessions,
  getStudySession,
  writeStudySessionPosition,
  setStudySessionIndex,
  startStudy,
  subscribeStudySessions,
  touchStudySession,
} from "@/entities/study-session";
import { saveStudyOperation } from "@/pages/study-session/model/actions/saveStudyOperation";
import type { StudySession } from "@/entities/study-session/model/types";
import { startStudySession } from "@/pages/study-session-start/model/actions/startStudySession";
import { createCard, createDeck, createPreferences } from "@/test/factories";
import { testDb } from "@/test/initializeTestFirestore";

vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
  auth: { currentUser: { uid: "uid" } },
}));

const preferences = { shuffled: false, maxNumberOfCardsToLearn: 0 };
const cards = ["first", "second", "third"].map((id, numberOfSeen) => ({ id, numberOfSeen, difficulty: 5 }));
const waitForCloud = (assertion: () => void | Promise<void>) => vi.waitFor(assertion, { timeout: 10_000 });
const readSession = (sessionId: string) => getDoc(doc(testDb, "studySession", sessionId));

function skipOperation(session: StudySession) {
  const cardId = session.cardOrderIds[session.currentIndex];
  if (cardId === undefined) throw new Error("Expected an active Card");
  return {
    id: crypto.randomUUID(),
    uid: session.remote.uid,
    deckId: session.deckId,
    sessionId: session.sessionId,
    cardId,
    currentIndex: session.currentIndex,
    cardCount: session.cardOrderIds.length,
    answeredAt: Date.now(),
  };
}

describe("StudySession cloud lifecycle [STUDY-SESSION-01] [STUDY-SESSION-03] [STUDY-SESSION-04]", () => {
  let stop: (() => void) | undefined;
  let deckId: string;

  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    clearStudySessions();
    cardStore.setState({ cardsById: {} });
    deckStore.setState({ remoteDecks: [] });
    preferencesStore.setState({ preferences: createPreferences({ study: preferences }) });
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: false, displayName: null });
    deckId = crypto.randomUUID();
    deckStore.setState({ remoteDecks: [createDeck({ id: deckId, uid: "uid" })] });
    cardStore.setState({
      cardsById: Object.fromEntries(cards.map(({ id }) => [id, createCard({ id, deckId, uid: "uid" })])),
    });
  });
  afterEach(async () => {
    stop?.();
    stop = undefined;
    await disableNetwork(testDb);
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    clearStudySessions();
    cardStore.setState({ cardsById: {} });
    deckStore.setState({ remoteDecks: [] });
    vi.restoreAllMocks();
  });
  afterAll(async () => {
    await Promise.all(getApps().map(deleteApp));
  });

  async function startRemote(): Promise<StudySession> {
    const previousId = getStudySession(deckId)?.sessionId;
    const sessionId = await startStudy({ deckId, cardOrderIds: cards.map(({ id }) => id), uid: "uid" });
    if (typeof sessionId !== "string") throw new Error("Expected a saved study session");
    await vi.waitUntil(() => {
      const session = getStudySession(deckId);
      return session !== undefined && (previousId === undefined || session.sessionId !== previousId);
    });
    const session = getStudySession(deckId);
    if (session === undefined) throw new Error("Expected a session");
    return session;
  }

  it("[FIRESTORE-STUDY-SESSION-01] restores saved order and cursor after resubscribing", async () => {
    // Given: Prepare `onError`, `started` and any shared test state below.
    const onError = vi.fn();
    stop = subscribeStudySessions("uid", onError);
    const started = await startRemote();
    // When: Exercise `setStudySessionIndex` with the prepared inputs.
    await setStudySessionIndex(deckId, 1);
    await waitForPendingWrites(testDb);
    // Then: Verify the expected result in the assertions below.
    expect((await readSession(started.sessionId)).data()).toEqual({
      uid: "uid",
      deckId,
      cardOrderIds: ["first", "second", "third"],
      currentIndex: 1,
      startedAt: Timestamp.fromMillis(started.remote.startedAt),
      endedAt: null,
      endReason: null,
      createdAt: expect.any(Timestamp),
      updatedAt: expect.any(Timestamp),
      lastStudiedAt: expect.any(Number),
    });
    // When: Exercise `stop` with the prepared inputs.
    stop();
    clearStudySessions();
    stop = subscribeStudySessions("uid", onError);
    // Then: Verify the expected result in the assertions below.
    await waitForCloud(() =>
      expect(getStudySession(deckId)).toMatchObject({
        sessionId: started.sessionId,
        cardOrderIds: cards.map(({ id }) => id),
        currentIndex: 1,
      })
    );
    expect(getStudySession(deckId)?.lastStudiedAt).toBeGreaterThan(0);
    expect(onError).not.toHaveBeenCalled();
  });

  it("[FIRESTORE-STUDY-SESSION-02] abandons the previous session only on explicit restart", async () => {
    // Given: Prepare `previous` and any shared test state below.
    stop = subscribeStudySessions("uid", vi.fn());
    const previous = await startRemote();
    await setStudySessionIndex(deckId, 1);
    await waitForPendingWrites(testDb);
    // When: Exercise `stop` with the prepared inputs.
    stop();
    // Then: Verify the expected result in the assertions below.
    expect((await readSession(previous.sessionId)).data()).toMatchObject({
      currentIndex: 1,
      endedAt: null,
      endReason: null,
    });
    // When: Exercise `query` with the prepared inputs.
    const documents = await getDocs(query(collection(testDb, "studySession"), where("uid", "==", "uid")));
    // Then: Verify the expected result in the assertions below.
    expect(documents.docs.filter((item) => item.data().deckId === deckId).map(({ id }) => id)).toEqual([
      previous.sessionId,
    ]);
    // When: Exercise `subscribeStudySessions` with the prepared inputs.
    stop = subscribeStudySessions("uid", vi.fn());
    const next = await startRemote();
    await waitForPendingWrites(testDb);
    // Then: Verify the expected result in the assertions below.
    expect((await readSession(previous.sessionId)).data()).toMatchObject({
      currentIndex: 1,
      endReason: "abandoned",
      endedAt: expect.any(Timestamp),
    });
    expect((await readSession(next.sessionId)).data()).toMatchObject({
      cardOrderIds: ["first", "second", "third"],
      currentIndex: 0,
      endedAt: null,
      endReason: null,
    });
    expect(next.sessionId).not.toBe(previous.sessionId);
  });

  it("[FIRESTORE-STUDY-SESSION-03] completes the final Card once and preserves lifecycle metadata", async () => {
    // Given: Prepare `started`, `original` and any shared test state below.
    stop = subscribeStudySessions("uid", vi.fn());
    const started = await startRemote();
    await waitForPendingWrites(testDb);
    const original = (await readSession(started.sessionId)).data();
    // When: Exercise `setStudySessionIndex` with the prepared inputs.
    await setStudySessionIndex(deckId, 2);
    // Then: Verify the expected result in the assertions below.
    await waitForCloud(() => expect(getStudySession(deckId)?.currentIndex).toBe(2));
    // When: Exercise `getStudySession` with the prepared inputs.
    const final = getStudySession(deckId);
    if (final === undefined) throw new Error("Expected the final Card");
    const operation = skipOperation(final);
    // Then: Verify the expected result in the assertions below.
    expect((await saveStudyOperation(operation, final)).endReason).toBe("completed");
    await waitForPendingWrites(testDb);
    const completed = (await readSession(started.sessionId)).data();
    expect(completed).toMatchObject({
      currentIndex: 2,
      endReason: "completed",
      endedAt: expect.any(Timestamp),
      createdAt: original?.createdAt,
      startedAt: original?.startedAt,
    });
    await waitForCloud(() => expect(getStudySession(deckId)).toBeUndefined());
    await expect(saveStudyOperation(operation, final)).rejects.toThrow("Study session does not match");
    await waitForPendingWrites(testDb);
    expect(getStudySession(deckId)).toBeUndefined();
    expect((await readSession(started.sessionId)).data()).toEqual(completed);
  });

  it("[FIRESTORE-STUDY-SESSION-04] syncs offline creation, progress and abandonment", async () => {
    // Given: Prepare `session`, `settled` and any shared test state below.
    stop = subscribeStudySessions("uid", vi.fn());
    const session = await startRemote();
    await disableNetwork(testDb);
    let settled = false;
    // When: Exercise `setStudySessionIndex(deckId, 1).then` with the prepared inputs.
    const progress = setStudySessionIndex(deckId, 1).then((value) => {
      settled = true;
      return value;
    });
    // Then: Verify the expected result in the assertions below.
    await waitForCloud(() => expect(getStudySession(deckId)?.currentIndex).toBe(1));
    expect(settled).toBe(false);
    // When: Exercise `enableNetwork` with the prepared inputs.
    await enableNetwork(testDb);
    // Then: Verify the expected result in the assertions below.
    expect(await progress).toBe(true);
    // When: Exercise `disableNetwork` with the prepared inputs.
    await disableNetwork(testDb);
    const abandoned = abandonStudySession(deckId);
    // Then: Verify the expected result in the assertions below.
    await waitForCloud(() => expect(getStudySession(deckId)).toBeUndefined());
    // When: Exercise `stop` with the prepared inputs.
    stop();
    // Then: Verify the expected result in the assertions below.
    expect((await getDocFromCache(doc(testDb, "studySession", session.sessionId))).data()).toMatchObject({
      currentIndex: 1,
      endReason: "abandoned",
    });
    // When: Exercise `clearStudySessions` with the prepared inputs.
    clearStudySessions();
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    await abandoned;
    // Then: Verify the expected result in the assertions below.
    expect((await readSession(session.sessionId)).data()).toMatchObject({ currentIndex: 1, endReason: "abandoned" });
    // When: Exercise `query` with the prepared inputs.
    const documents = await getDocs(query(collection(testDb, "studySession"), where("uid", "==", "uid")));
    // Then: Verify the expected result in the assertions below.
    expect(documents.docs.filter((item) => item.data().deckId === deckId).map(({ id }) => id)).toEqual([
      session.sessionId,
    ]);
  });

  it("[FIRESTORE-STUDY-SESSION-05] restarts offline while another Deck has pending writes", async () => {
    // Given: Prepare `deck`, `otherDeck`, `otherCards` and any shared test state below.
    stop = subscribeStudySessions("uid", vi.fn());
    const deck = createDeck({ id: deckId, uid: "uid" });
    const otherDeck = createDeck({ id: crypto.randomUUID(), uid: "uid" });
    const otherCards = cards.map((card) =>
      createCard({ ...card, uid: "uid", id: `other-${card.id}`, deckId: otherDeck.id })
    );
    deckStore.setState({ remoteDecks: [deck, otherDeck] });
    cardStore.setState({
      cardsById: Object.fromEntries(
        [...cards.map((card) => createCard({ ...card, uid: "uid", deckId })), ...otherCards].map((card) => [
          card.id,
          card,
        ])
      ),
    });
    // When: Evaluate `startStudySession` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(await startStudySession(deck.id, getStudyFilter(deck))).toEqual(expect.any(String));
    await waitForCloud(() => expect(getStudySession(deckId)).toBeDefined());
    // When: Exercise `setStudySessionIndex` with the prepared inputs.
    await setStudySessionIndex(deckId, 1);
    // Then: Verify the expected result in the assertions below.
    await waitForCloud(() => expect(getStudySession(deckId)?.currentIndex).toBe(1));
    await waitForPendingWrites(testDb);
    // When: Exercise `getStudySession` with the prepared inputs.
    const previous = getStudySession(deckId);
    stop();
    await disableNetwork(testDb);
    clearStudySessions();
    // Then: Verify the expected result in the assertions below.
    expect(getStudySession(deckId)).toBeUndefined();
    // When: Exercise `subscribeStudySessions` with the prepared inputs.
    stop = subscribeStudySessions("uid", vi.fn());
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getStudySession(deckId)?.currentIndex).toBe(previous?.currentIndex));
    // When: Exercise `startStudy` with the prepared inputs.
    const otherSave = startStudy({ deckId: otherDeck.id, cardOrderIds: otherCards.map(({ id }) => id), uid: "uid" });
    // Then: Verify the expected result in the assertions below.
    await waitForCloud(() =>
      expect(getStudySession(otherDeck.id)?.cardOrderIds).toEqual(otherCards.map(({ id }) => id))
    );
    let settled = false;
    // When: Exercise `startStudySession(deck.id, getStudyFilter(deck)).then` with the prepared inputs.
    const restart = startStudySession(deck.id, getStudyFilter(deck)).then((value) => {
      settled = true;
      return value;
    });
    // Then: Verify the expected result in the assertions below.
    await waitForCloud(() => expect(getStudySession(deckId)?.sessionId).not.toBe(previous?.sessionId));
    expect(settled).toBe(false);
    // When: Exercise `getStudySession` with the prepared inputs.
    const restarted = getStudySession(deckId);
    // Then: Verify the expected result in the assertions below.
    expect(restarted?.sessionId).not.toBe(previous?.sessionId);
    expect(restarted?.currentIndex).toBe(0);
    // When: Exercise `enableNetwork` with the prepared inputs.
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    await otherSave;
    // Then: Verify the expected result in the assertions below.
    expect(await restart).toBe(restarted?.sessionId);
    expect((await readSession(restarted?.sessionId ?? "missing")).data()?.endReason).toBeNull();
    expect((await readSession(previous?.sessionId ?? "missing")).data()?.endReason).toBe("abandoned");
  });

  it("[FIRESTORE-STUDY-SESSION-06] ignores malformed documents without blocking study", async () => {
    // Given: Prepare `valid`, `onError` and any shared test state below.
    stop = subscribeStudySessions("uid", vi.fn());
    const valid = await startRemote();
    await waitForPendingWrites(testDb);
    await setDoc(doc(testDb, "studySession", crypto.randomUUID()), {
      uid: "uid",
      answers: [],
      updatedAt: serverTimestamp(),
    });
    stop();
    clearStudySessions();
    const onError = vi.fn();
    // When: Exercise `subscribeStudySessions` with the prepared inputs.
    stop = subscribeStudySessions("uid", onError);
    // Then: Verify the expected result in the assertions below.
    await waitForCloud(() => expect(getStudySession(deckId)?.sessionId).toBe(valid.sessionId));
    // When: Exercise `startRemote` with the prepared inputs.
    const next = await startRemote();
    await waitForPendingWrites(testDb);
    // Then: Verify the expected result in the assertions below.
    expect((await readSession(next.sessionId)).data()?.endReason).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });

  it("[FIRESTORE-STUDY-SESSION-07] advances one Card without applying an old interaction twice", async () => {
    // Given: Prepare `started`, `operation` and any shared test state below.
    stop = subscribeStudySessions("uid", vi.fn());
    const started = await startRemote();
    const operation = skipOperation(started);
    // When: Evaluate `saveStudyOperation` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect((await saveStudyOperation(operation, started)).session.currentIndex).toBe(1);
    await waitForPendingWrites(testDb);
    await waitForCloud(() => expect(getStudySession(deckId)?.currentIndex).toBe(1));
    const advanced = (await readSession(started.sessionId)).data();
    expect(advanced).toMatchObject({
      cardOrderIds: ["first", "second", "third"],
      currentIndex: 1,
      startedAt: Timestamp.fromMillis(started.remote.startedAt),
      endedAt: null,
      endReason: null,
    });
    await expect(saveStudyOperation(operation, started)).rejects.toThrow("Study session does not match");
    await waitForPendingWrites(testDb);
    expect(getStudySession(deckId)).toMatchObject({ sessionId: started.sessionId, currentIndex: 1 });
    expect((await readSession(started.sessionId)).data()).toEqual(advanced);
  });

  it("[FIRESTORE-STUDY-SESSION-08] refreshes recency without changing the saved run", async () => {
    // Given: Prepare `started`, `original`, `touchedAt` and any shared test state below.
    stop = subscribeStudySessions("uid", vi.fn());
    const started = await startRemote();
    await setStudySessionIndex(deckId, 1);
    await waitForPendingWrites(testDb);
    const original = (await readSession(started.sessionId)).data();
    const touchedAt = Date.now() + 1000;
    const clock = vi.spyOn(Date, "now").mockReturnValue(touchedAt);
    // When: Exercise `touchStudySession` with the prepared inputs.
    try {
      await touchStudySession(deckId);
    } finally {
      clock.mockRestore();
    }
    await waitForPendingWrites(testDb);
    // Then: Verify the expected result in the assertions below.
    expect((await readSession(started.sessionId)).data()).toEqual({
      ...original,
      lastStudiedAt: touchedAt,
      updatedAt: expect.any(Timestamp),
    });
    // When: Exercise `stop` with the prepared inputs.
    stop();
    clearStudySessions();
    stop = subscribeStudySessions("uid", vi.fn());
    // Then: Verify the expected result in the assertions below.
    await waitForCloud(() =>
      expect(getStudySession(deckId)).toMatchObject({
        sessionId: started.sessionId,
        cardOrderIds: ["first", "second", "third"],
        currentIndex: 1,
        lastStudiedAt: touchedAt,
      })
    );
  });

  it("[FIRESTORE-STUDY-SESSION-09] restores the newest run per Deck despite updates to older runs", async () => {
    // Given: Prepare `olderId`, `latestId`, `otherId` and any shared test state below.
    const olderId = crypto.randomUUID();
    const latestId = crypto.randomUUID();
    const otherId = crypto.randomUUID();
    const otherDeckId = crypto.randomUUID();
    const older = {
      uid: "uid",
      deckId,
      cardOrderIds: ["first", "second", "third"],
      currentIndex: 1,
      startedAt: Timestamp.fromMillis(1000),
      createdAt: Timestamp.fromMillis(1000),
      updatedAt: serverTimestamp(),
      lastStudiedAt: 3000,
      endedAt: null,
      endReason: null,
    };
    await setDoc(doc(testDb, "studySession", olderId), older);
    await setDoc(doc(testDb, "studySession", latestId), {
      ...older,
      currentIndex: 2,
      startedAt: Timestamp.fromMillis(2000),
      createdAt: Timestamp.fromMillis(2000),
      updatedAt: serverTimestamp(),
      lastStudiedAt: 2000,
    });
    await setDoc(doc(testDb, "studySession", otherId), { ...older, deckId: otherDeckId });
    // When: Exercise `subscribeStudySessions` with the prepared inputs.
    stop = subscribeStudySessions("uid", vi.fn());
    // Then: Verify the expected result in the assertions below.
    await waitForCloud(() => {
      expect(getStudySession(deckId)).toMatchObject({ sessionId: latestId, currentIndex: 2 });
      expect(getStudySession(otherDeckId)).toMatchObject({ sessionId: otherId, currentIndex: 1 });
    });
  });

  it.each(["completed", "abandoned"] as const)(
    "[FIRESTORE-STUDY-SESSION-10] does not restore an older run after the latest run is %s",
    async (endReason) => {
      // Given: Prepare `started` and any shared test state below.
      stop = subscribeStudySessions("uid", vi.fn());
      const started = await startRemote();
      // When: Exercise `setStudySessionIndex` with the prepared inputs.
      await setStudySessionIndex(deckId, 2);
      // Then: Verify the expected result in the assertions below.
      await waitForCloud(() => expect(getStudySession(deckId)?.currentIndex).toBe(2));
      await waitForPendingWrites(testDb);
      const previousId = crypto.randomUUID();
      // When: Exercise `setDoc` with the prepared inputs.
      await setDoc(doc(testDb, "studySession", previousId), {
        ...(await readSession(started.sessionId)).data(),
        currentIndex: 0,
        startedAt: Timestamp.fromMillis(1000),
        createdAt: Timestamp.fromMillis(1000),
        updatedAt: serverTimestamp(),
        lastStudiedAt: 1000,
      });
      const final = getStudySession(deckId);
      if (final === undefined) throw new Error("Expected the latest session");
      // Then: Verify the expected result in the assertions below.
      expect(final.sessionId).toBe(started.sessionId);
      // When: Exercise `saveStudyOperation` with the prepared inputs.
      const result = await (endReason === "completed"
        ? saveStudyOperation(skipOperation(final), final)
        : abandonStudySession(deckId));
      // Then: Verify the expected result in the assertions below.
      expect(result?.endReason).toBe(endReason === "completed" ? "completed" : undefined);
      await waitForPendingWrites(testDb);
      const ended = (await readSession(started.sessionId)).data();
      expect(ended).toMatchObject({ endReason, endedAt: expect.any(Timestamp) });
      // A delayed progress write must not reopen the ended run or revive an older one.
      // When: Exercise `writeStudySessionPosition` with the prepared inputs.
      await writeStudySessionPosition(final, final.currentIndex);
      await waitForPendingWrites(testDb);
      // Then: Verify the expected result in the assertions below.
      expect((await readSession(started.sessionId)).data()).toMatchObject({
        endReason,
        endedAt: ended?.endedAt,
      });
      expect((await readSession(previousId)).data()?.endReason).toBeNull();
      // When: Exercise `stop` with the prepared inputs.
      stop();
      clearStudySessions();
      const onReady = vi.fn();
      stop = subscribeStudySessions("uid", vi.fn(), onReady);
      // Then: Verify the expected result in the assertions below.
      await waitForCloud(() => expect(onReady).toHaveBeenCalled());
      expect(getStudySession(deckId)).toBeUndefined();
    }
  );

  it("[FIRESTORE-STUDY-SESSION-11] reflects saved progress through the existing subscription", async () => {
    // Given: Prepare `started`, `updatedAt` and any shared test state below.
    stop = subscribeStudySessions("uid", vi.fn());
    const started = await startRemote();
    await waitForPendingWrites(testDb);
    const updatedAt = Timestamp.now();
    // When: Exercise `updateDoc` with the prepared inputs.
    await updateDoc(doc(testDb, "studySession", started.sessionId), {
      currentIndex: 1,
      lastStudiedAt: updatedAt.toMillis(),
      updatedAt: serverTimestamp(),
    });
    // Then: Verify the expected result in the assertions below.
    await waitForCloud(() =>
      expect(getStudySession(deckId)).toMatchObject({
        sessionId: started.sessionId,
        cardOrderIds: ["first", "second", "third"],
        currentIndex: 1,
        lastStudiedAt: updatedAt.toMillis(),
      })
    );
  });

  it.each(["completed", "abandoned"] as const)(
    "[FIRESTORE-STUDY-SESSION-12] removes a saved %s run without changing another Deck",
    async (endReason) => {
      // Given: Prepare `started` and any shared test state below.
      stop = subscribeStudySessions("uid", vi.fn());
      const started = await startRemote();
      // When: Exercise `setStudySessionIndex` with the prepared inputs.
      await setStudySessionIndex(deckId, 2);
      // Then: Verify the expected result in the assertions below.
      await waitForCloud(() => expect(getStudySession(deckId)?.currentIndex).toBe(2));
      const otherDeckId = crypto.randomUUID();
      // When: Exercise `startStudy` with the prepared inputs.
      await startStudy({ deckId: otherDeckId, cardOrderIds: ["other-card"], uid: "uid" });
      // Then: Verify the expected result in the assertions below.
      await waitForCloud(() => expect(getStudySession(otherDeckId)).toBeDefined());
      // When: Exercise `getStudySession` with the prepared inputs.
      const other = getStudySession(otherDeckId);
      if (other === undefined) throw new Error("Expected another Deck session");
      await waitForPendingWrites(testDb);
      const endedAt = Timestamp.now();
      await updateDoc(doc(testDb, "studySession", started.sessionId), {
        endReason,
        endedAt,
        updatedAt: serverTimestamp(),
      });
      // Then: Verify the expected result in the assertions below.
      await waitForCloud(() => {
        expect(getStudySession(deckId)).toBeUndefined();
        expect(getStudySession(otherDeckId)).toMatchObject({ sessionId: other.sessionId, currentIndex: 0 });
      });
      expect((await readSession(started.sessionId)).data()).toMatchObject({ currentIndex: 2, endReason, endedAt });
      expect((await readSession(other.sessionId)).data()).toMatchObject({ currentIndex: 0, endReason: null });
    }
  );

  it("[FIRESTORE-STUDY-SESSION-13] syncs offline completion without duplicating or restoring the run", async () => {
    // Given: Prepare `started` and any shared test state below.
    stop = subscribeStudySessions("uid", vi.fn());
    const started = await startRemote();
    await setStudySessionIndex(deckId, 2);
    // When: Exercise `disableNetwork` with the prepared inputs.
    await disableNetwork(testDb);
    // Then: Verify the expected result in the assertions below.
    await waitForCloud(() => expect(getStudySession(deckId)?.currentIndex).toBe(2));
    // When: Exercise `getStudySession` with the prepared inputs.
    const final = getStudySession(deckId);
    if (final === undefined) throw new Error("Expected the final Card");
    let settled = false;
    const completion = saveStudyOperation(skipOperation(final), final).then((value) => {
      settled = true;
      return value;
    });
    // Then: Verify the expected result in the assertions below.
    await waitForCloud(() => expect(getStudySession(deckId)).toBeUndefined());
    expect(settled).toBe(false);
    expect((await getDocFromCache(doc(testDb, "studySession", started.sessionId))).data()).toMatchObject({
      currentIndex: 2,
      endReason: "completed",
      endedAt: expect.any(Timestamp),
    });
    // When: Exercise `stop` with the prepared inputs.
    stop();
    clearStudySessions();
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    // Then: Verify the expected result in the assertions below.
    expect((await readSession(started.sessionId)).data()).toMatchObject({
      currentIndex: 2,
      endReason: "completed",
      endedAt: expect.any(Timestamp),
    });
    expect((await completion).endReason).toBe("completed");
    // When: Exercise `query` with the prepared inputs.
    const documents = await getDocs(query(collection(testDb, "studySession"), where("uid", "==", "uid")));
    // Then: Verify the expected result in the assertions below.
    expect(documents.docs.filter((item) => item.data().deckId === deckId).map(({ id }) => id)).toEqual([
      started.sessionId,
    ]);
    const onReady = vi.fn();
    // When: Exercise `subscribeStudySessions` with the prepared inputs.
    stop = subscribeStudySessions("uid", vi.fn(), onReady);
    // Then: Verify the expected result in the assertions below.
    await waitForCloud(() => expect(onReady).toHaveBeenCalled());
    expect(getStudySession(deckId)).toBeUndefined();
  });

  it.each([false, true])(
    "[FIRESTORE-STUDY-SESSION-14] leaves saved sessions unchanged when starting with no Cards (existing: %s)",
    async (hasPrevious) => {
      // Given: Prepare `previous`, `original` and any shared test state below.
      stop = subscribeStudySessions("uid", vi.fn());
      const previous = hasPrevious ? await startRemote() : undefined;
      if (previous) {
        await setStudySessionIndex(deckId, 1);
        await vi.waitUntil(() => getStudySession(deckId)?.currentIndex === 1);
      }
      await waitForPendingWrites(testDb);
      const original = previous ? (await readSession(previous.sessionId)).data() : undefined;
      // When: Evaluate `startStudy` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      expect(await startStudy({ deckId, cardOrderIds: [], uid: "uid" })).toBeUndefined();
      await waitForPendingWrites(testDb);
      // When: Exercise `query` with the prepared inputs.
      const documents = await getDocs(query(collection(testDb, "studySession"), where("uid", "==", "uid")));
      // Then: Verify the expected result in the assertions below.
      expect(documents.docs.filter((item) => item.data().deckId === deckId).map(({ id }) => id)).toEqual(
        previous ? [previous.sessionId] : []
      );
      expect(previous ? (await readSession(previous.sessionId)).data() : undefined).toEqual(original);
      const previousSession = expect.objectContaining({ sessionId: previous?.sessionId, currentIndex: 1 });
      expect(getStudySession(deckId)).toEqual(previous ? previousSession : undefined);
    }
  );

  it.each([["first", "first"], [""]])(
    "[FIRESTORE-STUDY-SESSION-15] rejects invalid card order %j without replacing the run",
    async (...cardOrderIds) => {
      // Given: Prepare `started`, `original` and any shared test state below.
      stop = subscribeStudySessions("uid", vi.fn());
      const started = await startRemote();
      await waitForPendingWrites(testDb);
      const original = (await readSession(started.sessionId)).data();
      // When: Evaluate `startStudy` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await expect(startStudy({ deckId, cardOrderIds, uid: "uid" })).rejects.toThrow();
      await waitForPendingWrites(testDb);
      // When: Exercise `query` with the prepared inputs.
      const documents = await getDocs(
        query(collection(testDb, "studySession"), where("uid", "==", "uid"), where("deckId", "==", deckId))
      );
      // Then: Verify the expected result in the assertions below.
      expect(documents.docs.map(({ id }) => id)).toEqual([started.sessionId]);
      expect((await readSession(started.sessionId)).data()).toEqual(original);
      expect(getStudySession(deckId)).toEqual(started);
    }
  );

  it.each(["start", "index", "save", "abandon", "touch"] as const)(
    "[FIRESTORE-STUDY-SESSION-16] rejects %s after the owner changes",
    async (operation) => {
      // Given: Prepare `started`, `original` and any shared test state below.
      stop = subscribeStudySessions("uid", vi.fn());
      const started = await startRemote();
      await waitForPendingWrites(testDb);
      const original = (await readSession(started.sessionId)).data();
      replaceAuthSession({ status: "authenticated", uid: "other", isAnonymous: false, displayName: null });
      // When: Observe the prepared result through the following checks.
      // Then: Verify the expected result in the assertions below.
      await expect(
        (() => {
          switch (operation) {
            case "start":
              return startStudy({ deckId, cardOrderIds: ["first"], uid: "uid" });
            case "index":
              return setStudySessionIndex(deckId, 1);
            case "save":
              return saveStudyOperation(skipOperation(started), started);
            case "abandon":
              return abandonStudySession(deckId);
            case "touch":
              return touchStudySession(deckId);
          }
        })()
      ).rejects.toThrow(operation === "save" ? "Study user changed" : "Study session owner changed");
      await waitForPendingWrites(testDb);
      // When: Exercise `query` with the prepared inputs.
      const documents = await getDocs(
        query(collection(testDb, "studySession"), where("uid", "==", "uid"), where("deckId", "==", deckId))
      );
      // Then: Verify the expected result in the assertions below.
      expect(documents.docs.map(({ id }) => id)).toEqual([started.sessionId]);
      expect((await readSession(started.sessionId)).data()).toEqual(original);
      expect(getStudySession(deckId)).toEqual(started);
    }
  );
});
