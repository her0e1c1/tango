import "@/test/initializeTestFirestore";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteApp, getApps } from "firebase/app";
import { collection, doc, getDoc, getDocs, query, Timestamp, where } from "firebase/firestore";
import {
  abandonStudySession,
  clearStudySessions,
  getStudySession,
  moveStudySession,
  setStudySessionIndex,
  startStudy,
  syncStudySessions,
  touchStudySession,
} from "@/entities/study-session";
import { saveStudySession } from "@/entities/study-session/api/firestore";
import { studySessionStore } from "@/entities/study-session/model/store";
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
    deckId = crypto.randomUUID();
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    clearStudySessions();
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
    await waitForCloud(async () => {
      expect((await readSession(started.sessionId)).data()?.currentIndex).toBe(1);
    });
    const data = (await readSession(started.sessionId)).data();
    expect(data).toEqual({
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
    await waitForCloud(() => {
      expect(getStudySession(deckId)).toMatchObject({
        sessionId: started.sessionId,
        cardOrderIds: cards.map(({ id }) => id),
        currentIndex: 1,
      });
    });
    expect(getStudySession(deckId)?.lastStudiedAt).toBe(0);
    touchStudySession(deckId);
    expect(getStudySession(deckId)?.lastStudiedAt).toBeGreaterThan(0);
    expect(onError).not.toHaveBeenCalled();
  });

  it("keeps a departed session active and abandons it only on explicit restart", async () => {
    const onError = vi.fn();
    stop = syncStudySessions("uid", onError);
    const previous = startRemote();
    setStudySessionIndex(deckId, 1);
    await waitForCloud(async () => expect((await readSession(previous.sessionId)).data()?.currentIndex).toBe(1));
    stop();
    expect((await readSession(previous.sessionId)).data()?.endReason).toBeNull();
    const next = startRemote();
    stop = syncStudySessions("uid", onError);
    await waitForCloud(async () => {
      expect((await readSession(previous.sessionId)).data()).toMatchObject({
        endReason: "abandoned",
        endedAt: expect.any(Timestamp),
      });
      expect((await readSession(next.sessionId)).data()).toMatchObject({ currentIndex: 0, endReason: null });
    });
    expect(next.sessionId).not.toBe(previous.sessionId);
    await saveStudySession("uid", { session: previous, endReason: null });
    expect((await readSession(previous.sessionId)).data()?.endReason).toBe("abandoned");
    expect(getStudySession(deckId)?.sessionId).toBe(next.sessionId);
    expect(onError).not.toHaveBeenCalled();
  });

  it("completes the final Card once and rejects stale movement and active retries", async () => {
    const started = startRemote();
    await saveStudySession("uid", { session: started, endReason: null });
    const original = (await readSession(started.sessionId)).data();
    setStudySessionIndex(deckId, 2);
    const final = getStudySession(deckId);
    if (final === undefined) throw new Error("Expected the final Card");
    expect(moveStudySession(final)).toBe(true);
    stop = syncStudySessions("uid", vi.fn());
    await waitForCloud(async () => expect((await readSession(started.sessionId)).data()?.endReason).toBe("completed"));
    await saveStudySession("uid", { session: started, endReason: null });
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

  it("keeps forward positions across concurrent saves without treating the cursor as an answer count", async () => {
    const session = startRemote();
    await saveStudySession("uid", { session, endReason: null });
    await Promise.all([
      saveStudySession("uid", { session: { ...session, currentIndex: 2 }, endReason: null }),
      saveStudySession("uid", { session: { ...session, currentIndex: 1 }, endReason: null }),
    ]);
    expect((await readSession(session.sessionId)).data()?.currentIndex).toBe(2);
    expect((await readSession(session.sessionId)).data()).not.toHaveProperty("answers");
  });

  it("recovers pending creation and abandonment from browser storage using the original id", async () => {
    const session = startRemote();
    setStudySessionIndex(deckId, 1);
    abandonStudySession(deckId);
    const stored = localStorage.getItem("tango-study");
    clearStudySessions();
    localStorage.setItem("tango-study", stored ?? "");
    await studySessionStore.persist.rehydrate();
    stop = syncStudySessions("uid", vi.fn());
    await waitForCloud(async () =>
      expect((await readSession(session.sessionId)).data()).toMatchObject({ currentIndex: 1, endReason: "abandoned" })
    );
    await saveStudySession("uid", { session, endReason: null });
    expect(getStudySession(deckId)).toBeUndefined();
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
    await expect(saveStudySession("uid", { session, endReason: null })).rejects.toThrow("owner");
    expect((await readSession(session.sessionId)).exists()).toBe(false);
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
  });

  it("resumes the newest server-created run despite an older device clock being ahead", async () => {
    const old = startRemote();
    await saveStudySession("uid", {
      session: { ...old, currentIndex: 2, remote: { uid: "uid", startedAt: Date.now() + 86_400_000 } },
      endReason: "completed",
    });
    clearStudySessions();
    const current = startRemote();
    await saveStudySession("uid", { session: current, endReason: null });
    clearStudySessions();
    stop = syncStudySessions("uid", vi.fn());
    await waitForCloud(() => expect(getStudySession(deckId)?.sessionId).toBe(current.sessionId));
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
  });

  it("leaves only one active run after simultaneous starts on the same Deck", async () => {
    const first = startRemote();
    clearStudySessions();
    const second = startRemote();
    await Promise.all([
      saveStudySession("uid", { session: first, endReason: null }),
      saveStudySession("uid", { session: second, endReason: null }),
    ]);
    const documents = await getDocs(
      query(collection(testDb, "studySession"), where("uid", "==", "uid"), where("deckId", "==", deckId))
    );
    expect(documents.docs.filter((item) => item.data().endReason === null)).toHaveLength(1);
    expect(documents.docs.filter((item) => item.data().endReason === "abandoned")).toHaveLength(1);
  });
});
