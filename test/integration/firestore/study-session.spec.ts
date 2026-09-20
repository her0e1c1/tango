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
  Timestamp,
  waitForPendingWrites,
  where,
} from "firebase/firestore";
import { replaceAuthSession } from "@/entities/auth";
import {
  abandonStudySession,
  clearStudySessions,
  getStudySession,
  getStudySessionSyncStatus,
  moveStudySession,
  setStudySessionIndex,
  startStudy,
  syncStudySessions,
  touchStudySession,
} from "@/entities/study-session";
import { createStudySession, updateStudySession } from "@/entities/study-session/api/firestore";
import type { StudySession } from "@/entities/study-session/model/types";
import { testDb } from "@/test/initializeTestFirestore";

vi.mock("@/shared/firebase", async () => ({ db: (await import("@/test/initializeTestFirestore")).testDb }));

const cards = ["first", "second", "third"].map((id, numberOfSeen) => ({ id, numberOfSeen, difficulty: 5 }));
const waitForCloud = (assertion: () => void | Promise<void>) => vi.waitFor(assertion, { timeout: 10_000 });
const preferences = { shuffled: false, maxNumberOfCardsToLearn: 0 };
const readSession = (sessionId: string) => getDoc(doc(testDb, "studySession", sessionId));

describe("StudySession cloud lifecycle [SWIPE-06] [SWIPE-08] [SWIPE-09] [SWIPE-10] [SWIPE-17] [PERSIST-02]", () => {
  let stop: (() => void) | undefined;
  let deckId: string;

  beforeEach(() => {
    clearStudySessions();
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: false, displayName: null });
    deckId = crypto.randomUUID();
  });
  afterEach(async () => {
    stop?.();
    stop = undefined;
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    clearStudySessions();
    vi.restoreAllMocks();
  });
  afterAll(async () => {
    await Promise.all(getApps().map(deleteApp));
  });

  function startRemote(): StudySession {
    startStudy(deckId, cards, preferences, "uid");
    const session = getStudySession(deckId);
    if (session === undefined) throw new Error("Expected a session");
    return session;
  }

  it("saves the fixed order and cursor without answers and restores it on a fresh client", async () => {
    const onError = vi.fn();
    stop = syncStudySessions("uid", onError);
    const started = startRemote();
    setStudySessionIndex(deckId, 1);
    await waitForPendingWrites(testDb);
    expect((await readSession(started.sessionId)).data()).toEqual({
      uid: "uid",
      deckId,
      cardOrderIds: ["first", "second", "third"],
      currentIndex: 1,
      startedAt: Timestamp.fromMillis(started.remote?.startedAt ?? 0),
      endedAt: null,
      endReason: null,
      createdAt: expect.any(Timestamp),
      updatedAt: expect.any(Timestamp),
    });
    stop();
    clearStudySessions();
    stop = syncStudySessions("uid", onError);
    await waitForCloud(() =>
      expect(getStudySession(deckId)).toMatchObject({
        sessionId: started.sessionId,
        cardOrderIds: cards.map(({ id }) => id),
        currentIndex: 1,
      })
    );
    expect(getStudySession(deckId)?.lastStudiedAt).toBe(0);
    touchStudySession(deckId);
    expect(getStudySession(deckId)?.lastStudiedAt).toBeGreaterThan(0);
    expect(onError).not.toHaveBeenCalled();
  });

  it("keeps a departed session active and abandons the known session only on explicit restart", async () => {
    stop = syncStudySessions("uid", vi.fn());
    const previous = startRemote();
    setStudySessionIndex(deckId, 1);
    await waitForPendingWrites(testDb);
    stop();
    expect((await readSession(previous.sessionId)).data()?.endReason).toBeNull();
    const next = startRemote();
    await waitForPendingWrites(testDb);
    expect((await readSession(previous.sessionId)).data()).toMatchObject({
      endReason: "abandoned",
      endedAt: expect.any(Timestamp),
    });
    expect((await readSession(next.sessionId)).data()).toMatchObject({ currentIndex: 0, endReason: null });
    expect(next.sessionId).not.toBe(previous.sessionId);
    // A late progress patch does not write endReason or endedAt.
    await updateStudySession({ ...previous, currentIndex: 1 }, null);
    expect((await readSession(previous.sessionId)).data()?.endReason).toBe("abandoned");
  });

  it("completes the final Card once and rejects stale movement and active retries", async () => {
    const started = startRemote();
    await waitForPendingWrites(testDb);
    const original = (await readSession(started.sessionId)).data();
    setStudySessionIndex(deckId, 2);
    const final = getStudySession(deckId);
    if (final === undefined) throw new Error("Expected the final Card");
    expect(moveStudySession(final)).toBe(true);
    await waitForPendingWrites(testDb);
    await expect(updateStudySession(started, null)).rejects.toMatchObject({ code: "permission-denied" });
    await expect(createStudySession(started)).rejects.toMatchObject({ code: "permission-denied" });
    await expect(updateStudySession(started, "abandoned")).resolves.toBeUndefined();
    expect(moveStudySession(final)).toBe(false);
    expect(getStudySession(deckId)).toBeUndefined();
    expect((await readSession(started.sessionId)).data()).toMatchObject({
      currentIndex: 2,
      endReason: "completed",
      endedAt: expect.any(Timestamp),
      createdAt: original?.createdAt,
      startedAt: original?.startedAt,
    });
  });

  it("keeps forward positions across concurrent writes", async () => {
    const session = startRemote();
    await waitForPendingWrites(testDb);
    await Promise.allSettled([
      updateStudySession({ ...session, currentIndex: 2 }, null),
      updateStudySession({ ...session, currentIndex: 1 }, null),
    ]);
    expect((await readSession(session.sessionId)).data()?.currentIndex).toBe(2);
  });

  it("uses the SDK offline queue for creation, progress and abandonment after leaving", async () => {
    stop = syncStudySessions("uid", vi.fn());
    await disableNetwork(testDb);
    const session = startRemote();
    setStudySessionIndex(deckId, 1);
    abandonStudySession(deckId);
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

  it("never uploads a local-only session while cloud synchronization is running", async () => {
    stop = syncStudySessions("uid", vi.fn());
    startStudy(deckId, cards, preferences);
    const session = getStudySession(deckId);
    if (session === undefined) throw new Error("Expected a local session");
    setStudySessionIndex(deckId, 1);
    await expect(createStudySession(session)).rejects.toThrow("local");
    const documents = await getDocs(query(collection(testDb, "studySession"), where("uid", "==", "uid")));
    expect(documents.docs.some(({ id }) => id === session.sessionId)).toBe(false);
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
  });

  it("selects the newest server-created run without abandoning other runs", async () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(Date.now() + 86_400_000);
    const old = startRemote();
    await waitForPendingWrites(testDb);
    clock.mockRestore();
    // Another client starts a run before this client receives its own creation timestamp.
    const current = { ...old, sessionId: crypto.randomUUID(), remote: { uid: "uid", startedAt: Date.now() } };
    await createStudySession(current);
    stop = syncStudySessions("uid", vi.fn());
    await waitForCloud(() => expect(getStudySession(deckId)?.sessionId).toBe(current.sessionId));
    expect((await readSession(old.sessionId)).data()?.endReason).toBeNull();
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
  });

  it("ignores malformed documents without blocking valid sessions or new study", async () => {
    const valid = startRemote();
    await waitForPendingWrites(testDb);
    await setDoc(doc(testDb, "studySession", crypto.randomUUID()), { uid: "uid", answers: [] });
    clearStudySessions();
    const onError = vi.fn();
    stop = syncStudySessions("uid", onError);
    await waitForCloud(() => expect(getStudySession(deckId)?.sessionId).toBe(valid.sessionId));
    expect(getStudySessionSyncStatus("uid")).toBe("ready");
    const next = startRemote();
    await waitForPendingWrites(testDb);
    expect((await readSession(next.sessionId)).data()?.endReason).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });
});
