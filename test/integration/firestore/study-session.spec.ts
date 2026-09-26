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
  moveStudySession,
  setStudySessionIndex,
  startStudy,
  subscribeStudySessions,
  touchStudySession,
} from "@/entities/study-session";
import { updateStudySession } from "@/entities/study-session/api/firestore";
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

describe("StudySession cloud lifecycle [STUDY-SESSION-01] [STUDY-SESSION-03] [STUDY-SESSION-04]", () => {
  let stop: (() => void) | undefined;
  let deckId: string;

  beforeEach(() => {
    clearStudySessions();
    cardStore.setState({ remoteCards: [] });
    deckStore.setState({ remoteDecks: [] });
    preferencesStore.setState({ preferences: createPreferences({ study: preferences }) });
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: false, displayName: null });
    deckId = crypto.randomUUID();
  });
  afterEach(async () => {
    stop?.();
    stop = undefined;
    await disableNetwork(testDb);
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    clearStudySessions();
    cardStore.setState({ remoteCards: [] });
    deckStore.setState({ remoteDecks: [] });
    vi.restoreAllMocks();
  });
  afterAll(async () => {
    await Promise.all(getApps().map(deleteApp));
  });

  async function startRemote(): Promise<StudySession> {
    const previousId = getStudySession(deckId)?.sessionId;
    const sessionId = startStudy({ deckId, cardOrderIds: cards.map(({ id }) => id), uid: "uid" });
    if (typeof sessionId !== "string") throw new Error("Expected synchronous study acceptance");
    await vi.waitUntil(() => {
      const session = getStudySession(deckId);
      return session !== undefined && (previousId === undefined || session.sessionId !== previousId);
    });
    const session = getStudySession(deckId);
    if (session === undefined) throw new Error("Expected a session");
    return session;
  }

  it("[FIRESTORE-STUDY-SESSION-01] restores saved order and cursor after resubscribing", async () => {
    const onError = vi.fn();
    stop = subscribeStudySessions("uid", onError);
    const started = await startRemote();
    setStudySessionIndex(deckId, 1);
    await waitForPendingWrites(testDb);
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
    stop();
    clearStudySessions();
    stop = subscribeStudySessions("uid", onError);
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
    stop = subscribeStudySessions("uid", vi.fn());
    const previous = await startRemote();
    setStudySessionIndex(deckId, 1);
    await waitForPendingWrites(testDb);
    stop();
    expect((await readSession(previous.sessionId)).data()).toMatchObject({
      currentIndex: 1,
      endedAt: null,
      endReason: null,
    });
    const documents = await getDocs(query(collection(testDb, "studySession"), where("uid", "==", "uid")));
    expect(documents.docs.filter((item) => item.data().deckId === deckId).map(({ id }) => id)).toEqual([
      previous.sessionId,
    ]);
    stop = subscribeStudySessions("uid", vi.fn());
    const next = await startRemote();
    await waitForPendingWrites(testDb);
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
    stop = subscribeStudySessions("uid", vi.fn());
    const started = await startRemote();
    await waitForPendingWrites(testDb);
    const original = (await readSession(started.sessionId)).data();
    setStudySessionIndex(deckId, 2);
    await waitForCloud(() => expect(getStudySession(deckId)?.currentIndex).toBe(2));
    const final = getStudySession(deckId);
    if (final === undefined) throw new Error("Expected the final Card");
    expect(moveStudySession(final)).toBe(true);
    await waitForPendingWrites(testDb);
    const completed = (await readSession(started.sessionId)).data();
    expect(completed).toMatchObject({
      currentIndex: 2,
      endReason: "completed",
      endedAt: expect.any(Timestamp),
      createdAt: original?.createdAt,
      startedAt: original?.startedAt,
    });
    expect(moveStudySession(final)).toBe(false);
    await waitForPendingWrites(testDb);
    expect(getStudySession(deckId)).toBeUndefined();
    expect((await readSession(started.sessionId)).data()).toEqual(completed);
  });

  it("[FIRESTORE-STUDY-SESSION-04] syncs offline creation, progress and abandonment", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    await disableNetwork(testDb);
    const session = await startRemote();
    expect(setStudySessionIndex(deckId, 1)).toBe(true);
    expect(abandonStudySession(deckId)).toBeUndefined();
    stop();
    expect((await getDocFromCache(doc(testDb, "studySession", session.sessionId))).data()).toMatchObject({
      currentIndex: 1,
      endReason: "abandoned",
    });
    clearStudySessions();
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    expect((await readSession(session.sessionId)).data()).toMatchObject({ currentIndex: 1, endReason: "abandoned" });
    const documents = await getDocs(query(collection(testDb, "studySession"), where("uid", "==", "uid")));
    expect(documents.docs.filter((item) => item.data().deckId === deckId).map(({ id }) => id)).toEqual([
      session.sessionId,
    ]);
  });

  it("[FIRESTORE-STUDY-SESSION-05] restarts offline while another Deck has pending writes", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    const deck = createDeck({ id: deckId, uid: "uid" });
    const otherDeck = createDeck({ id: crypto.randomUUID(), uid: "uid" });
    const otherCards = cards.map((card) =>
      createCard({ ...card, uid: "uid", id: `other-${card.id}`, deckId: otherDeck.id })
    );
    deckStore.setState({ remoteDecks: [deck, otherDeck] });
    cardStore.setState({
      remoteCards: [...cards.map((card) => createCard({ ...card, uid: "uid", deckId })), ...otherCards],
    });
    expect(await startStudySession(deck.id, deck)).toEqual(expect.any(String));
    await waitForCloud(() => expect(getStudySession(deckId)).toBeDefined());
    setStudySessionIndex(deckId, 1);
    await waitForCloud(() => expect(getStudySession(deckId)?.currentIndex).toBe(1));
    await waitForPendingWrites(testDb);
    const previous = getStudySession(deckId);
    stop();
    await disableNetwork(testDb);
    clearStudySessions();
    expect(getStudySession(deckId)).toBeUndefined();
    stop = subscribeStudySessions("uid", vi.fn());
    await vi.waitFor(() => expect(getStudySession(deckId)?.currentIndex).toBe(previous?.currentIndex));
    expect(await startStudySession(otherDeck.id, otherDeck)).toEqual(expect.any(String));
    await waitForCloud(() =>
      expect(getStudySession(otherDeck.id)?.cardOrderIds).toEqual(otherCards.map(({ id }) => id))
    );
    expect(await startStudySession(deck.id, deck)).toEqual(expect.any(String));
    await waitForCloud(() => expect(getStudySession(deckId)?.sessionId).not.toBe(previous?.sessionId));
    const restarted = getStudySession(deckId);
    expect(restarted?.sessionId).not.toBe(previous?.sessionId);
    expect(restarted?.currentIndex).toBe(0);
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    expect((await readSession(restarted?.sessionId ?? "missing")).data()?.endReason).toBeNull();
    expect((await readSession(previous?.sessionId ?? "missing")).data()?.endReason).toBe("abandoned");
  });

  it("[FIRESTORE-STUDY-SESSION-06] ignores malformed documents without blocking study", async () => {
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
    stop = subscribeStudySessions("uid", onError);
    await waitForCloud(() => expect(getStudySession(deckId)?.sessionId).toBe(valid.sessionId));
    const next = await startRemote();
    await waitForPendingWrites(testDb);
    expect((await readSession(next.sessionId)).data()?.endReason).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });

  it("[FIRESTORE-STUDY-SESSION-07] advances one Card without applying an old interaction twice", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    const started = await startRemote();
    expect(moveStudySession(started)).toBe(true);
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
    expect(moveStudySession(started)).toBe(false);
    await waitForPendingWrites(testDb);
    expect(getStudySession(deckId)).toMatchObject({ sessionId: started.sessionId, currentIndex: 1 });
    expect((await readSession(started.sessionId)).data()).toEqual(advanced);
  });

  it("[FIRESTORE-STUDY-SESSION-08] refreshes recency without changing the saved run", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    const started = await startRemote();
    setStudySessionIndex(deckId, 1);
    await waitForPendingWrites(testDb);
    const original = (await readSession(started.sessionId)).data();
    const touchedAt = Date.now() + 1000;
    const clock = vi.spyOn(Date, "now").mockReturnValue(touchedAt);
    try {
      touchStudySession(deckId);
    } finally {
      clock.mockRestore();
    }
    await waitForPendingWrites(testDb);
    expect((await readSession(started.sessionId)).data()).toEqual({
      ...original,
      lastStudiedAt: touchedAt,
      updatedAt: expect.any(Timestamp),
    });
    stop();
    clearStudySessions();
    stop = subscribeStudySessions("uid", vi.fn());
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
    stop = subscribeStudySessions("uid", vi.fn());
    await waitForCloud(() => {
      expect(getStudySession(deckId)).toMatchObject({ sessionId: latestId, currentIndex: 2 });
      expect(getStudySession(otherDeckId)).toMatchObject({ sessionId: otherId, currentIndex: 1 });
    });
  });

  it.each(["completed", "abandoned"] as const)(
    "[FIRESTORE-STUDY-SESSION-10] does not restore an older run after the latest run is %s",
    async (endReason) => {
      stop = subscribeStudySessions("uid", vi.fn());
      const started = await startRemote();
      setStudySessionIndex(deckId, 2);
      await waitForCloud(() => expect(getStudySession(deckId)?.currentIndex).toBe(2));
      await waitForPendingWrites(testDb);
      const previousId = crypto.randomUUID();
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
      expect(final.sessionId).toBe(started.sessionId);
      const completed = endReason === "completed" ? moveStudySession(final) : abandonStudySession(deckId);
      expect(completed).toBe(endReason === "completed" ? true : undefined);
      await waitForPendingWrites(testDb);
      const ended = (await readSession(started.sessionId)).data();
      expect(ended).toMatchObject({ endReason, endedAt: expect.any(Timestamp) });
      // A delayed progress write must not reopen the ended run or revive an older one.
      updateStudySession(final, null);
      await waitForPendingWrites(testDb);
      expect((await readSession(started.sessionId)).data()).toMatchObject({
        endReason,
        endedAt: ended?.endedAt,
      });
      expect((await readSession(previousId)).data()?.endReason).toBeNull();
      stop();
      clearStudySessions();
      const onReady = vi.fn();
      stop = subscribeStudySessions("uid", vi.fn(), onReady);
      await waitForCloud(() => expect(onReady).toHaveBeenCalled());
      expect(getStudySession(deckId)).toBeUndefined();
    }
  );

  it("[FIRESTORE-STUDY-SESSION-11] reflects saved progress through the existing subscription", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    const started = await startRemote();
    await waitForPendingWrites(testDb);
    const updatedAt = Timestamp.now();
    await updateDoc(doc(testDb, "studySession", started.sessionId), {
      currentIndex: 1,
      lastStudiedAt: updatedAt.toMillis(),
      updatedAt: serverTimestamp(),
    });
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
      stop = subscribeStudySessions("uid", vi.fn());
      const started = await startRemote();
      setStudySessionIndex(deckId, 2);
      await waitForCloud(() => expect(getStudySession(deckId)?.currentIndex).toBe(2));
      const otherDeckId = crypto.randomUUID();
      startStudy({ deckId: otherDeckId, cardOrderIds: ["other-card"], uid: "uid" });
      await waitForCloud(() => expect(getStudySession(otherDeckId)).toBeDefined());
      const other = getStudySession(otherDeckId);
      if (other === undefined) throw new Error("Expected another Deck session");
      await waitForPendingWrites(testDb);
      const endedAt = Timestamp.now();
      await updateDoc(doc(testDb, "studySession", started.sessionId), {
        endReason,
        endedAt,
        updatedAt: serverTimestamp(),
      });
      await waitForCloud(() => {
        expect(getStudySession(deckId)).toBeUndefined();
        expect(getStudySession(otherDeckId)).toMatchObject({ sessionId: other.sessionId, currentIndex: 0 });
      });
      expect((await readSession(started.sessionId)).data()).toMatchObject({ currentIndex: 2, endReason, endedAt });
      expect((await readSession(other.sessionId)).data()).toMatchObject({ currentIndex: 0, endReason: null });
    }
  );

  it("[FIRESTORE-STUDY-SESSION-13] syncs offline completion without duplicating or restoring the run", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    await disableNetwork(testDb);
    const started = await startRemote();
    setStudySessionIndex(deckId, 2);
    await waitForCloud(() => expect(getStudySession(deckId)?.currentIndex).toBe(2));
    const final = getStudySession(deckId);
    if (final === undefined) throw new Error("Expected the final Card");
    expect(moveStudySession(final)).toBe(true);
    expect((await getDocFromCache(doc(testDb, "studySession", started.sessionId))).data()).toMatchObject({
      currentIndex: 2,
      endReason: "completed",
      endedAt: expect.any(Timestamp),
    });
    stop();
    clearStudySessions();
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    expect((await readSession(started.sessionId)).data()).toMatchObject({
      currentIndex: 2,
      endReason: "completed",
      endedAt: expect.any(Timestamp),
    });
    const documents = await getDocs(query(collection(testDb, "studySession"), where("uid", "==", "uid")));
    expect(documents.docs.filter((item) => item.data().deckId === deckId).map(({ id }) => id)).toEqual([
      started.sessionId,
    ]);
    const onReady = vi.fn();
    stop = subscribeStudySessions("uid", vi.fn(), onReady);
    await waitForCloud(() => expect(onReady).toHaveBeenCalled());
    expect(getStudySession(deckId)).toBeUndefined();
  });

  it.each([false, true])(
    "[FIRESTORE-STUDY-SESSION-14] leaves saved sessions unchanged when starting with no Cards (existing: %s)",
    async (hasPrevious) => {
      stop = subscribeStudySessions("uid", vi.fn());
      const previous = hasPrevious ? await startRemote() : undefined;
      if (previous) {
        setStudySessionIndex(deckId, 1);
        await vi.waitUntil(() => getStudySession(deckId)?.currentIndex === 1);
      }
      await waitForPendingWrites(testDb);
      const original = previous ? (await readSession(previous.sessionId)).data() : undefined;
      expect(startStudy({ deckId, cardOrderIds: [], uid: "uid" })).toBeUndefined();
      await waitForPendingWrites(testDb);
      const documents = await getDocs(query(collection(testDb, "studySession"), where("uid", "==", "uid")));
      expect(documents.docs.filter((item) => item.data().deckId === deckId).map(({ id }) => id)).toEqual(
        previous ? [previous.sessionId] : []
      );
      expect(previous ? (await readSession(previous.sessionId)).data() : undefined).toEqual(original);
      const previousSession = expect.objectContaining({ sessionId: previous?.sessionId, currentIndex: 1 });
      expect(getStudySession(deckId)).toEqual(previous ? previousSession : undefined);
    }
  );

  it.each([["first", "first"], [""]])(
    "[FIRESTORE-STUDY-SESSION-15] rejects invalid card order %j synchronously without replacing the run",
    async (...cardOrderIds) => {
      stop = subscribeStudySessions("uid", vi.fn());
      const started = await startRemote();
      await waitForPendingWrites(testDb);
      const original = (await readSession(started.sessionId)).data();
      expect(() => startStudy({ deckId, cardOrderIds, uid: "uid" })).toThrow();
      await waitForPendingWrites(testDb);
      const documents = await getDocs(
        query(collection(testDb, "studySession"), where("uid", "==", "uid"), where("deckId", "==", deckId))
      );
      expect(documents.docs.map(({ id }) => id)).toEqual([started.sessionId]);
      expect((await readSession(started.sessionId)).data()).toEqual(original);
      expect(getStudySession(deckId)).toEqual(started);
    }
  );

  it.each(["start", "index", "move", "abandon", "touch"] as const)(
    "[FIRESTORE-STUDY-SESSION-16] rejects %s synchronously after the owner changes",
    async (operation) => {
      stop = subscribeStudySessions("uid", vi.fn());
      const started = await startRemote();
      await waitForPendingWrites(testDb);
      const original = (await readSession(started.sessionId)).data();
      replaceAuthSession({ status: "authenticated", uid: "other", isAnonymous: false, displayName: null });
      expect(() => {
        switch (operation) {
          case "start":
            return startStudy({ deckId, cardOrderIds: ["first"], uid: "uid" });
          case "index":
            return setStudySessionIndex(deckId, 1);
          case "move":
            return moveStudySession(started);
          case "abandon":
            return abandonStudySession(deckId);
          case "touch":
            return touchStudySession(deckId);
        }
      }).toThrow("Study session owner changed");
      await waitForPendingWrites(testDb);
      const documents = await getDocs(
        query(collection(testDb, "studySession"), where("uid", "==", "uid"), where("deckId", "==", deckId))
      );
      expect(documents.docs.map(({ id }) => id)).toEqual([started.sessionId]);
      expect((await readSession(started.sessionId)).data()).toEqual(original);
      expect(getStudySession(deckId)).toEqual(started);
    }
  );
});
