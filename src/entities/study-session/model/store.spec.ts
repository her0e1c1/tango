/**
 * @file Exercises visible session state and preserves the legacy browser backup.
 */

import { afterAll, afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";

import { act, renderHook } from "@testing-library/react";
import { deleteApp, getApp } from "firebase/app";
import { Timestamp, type QuerySnapshot } from "firebase/firestore";
import { subscribeStudyHistory, subscribeStudySessions } from "../api/firestore";
import { applyStudySessionSnapshot } from "./store";
import { useRemoteStudySessionsLoading } from "./hooks";
import { startStudy, restoreStudySession } from "@/test/entityFixtures";
import { clearStudySessions, getStudySession, setStudySessionOwner, studySessionStore } from "./store";

const STUDY_STORAGE_KEY = "tango-study";

// Starts a deterministic study session from the supplied Card order.
const startSession = (deckId: string, cardOrderIds: string[]): void => {
  startStudy(
    deckId,
    cardOrderIds.map((id, numberOfSeen) => ({ id, difficulty: 5, numberOfSeen })),
    { shuffled: false, maxNumberOfCardsToLearn: 0 },
    "uid"
  );
};

describe("study store [STUDY-SESSION-01] [STUDY-ACTIONS-04]", () => {
  const store = studySessionStore;

  beforeEach(() => {
    store.setState({ sessionsByDeckId: {} });
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearStudySessions();
    vi.unstubAllGlobals();
  });

  it("keeps independent study sessions for multiple decks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);

    startSession("deck-1", ["card-1", "card-2"]);
    vi.setSystemTime(2000);
    startSession("deck-2", ["card-3"]);

    expect(store.getState().sessionsByDeckId).toEqual({
      "deck-1": {
        sessionId: expect.any(String),
        deckId: "deck-1",
        cardOrderIds: ["card-1", "card-2"],
        currentIndex: 0,
        lastStudiedAt: 1000,
        remote: { uid: "uid", startedAt: 1000 },
      },
      "deck-2": {
        sessionId: expect.any(String),
        deckId: "deck-2",
        cardOrderIds: ["card-3"],
        currentIndex: 0,
        lastStudiedAt: 2000,
        remote: { uid: "uid", startedAt: 2000 },
      },
    });
  });

  it("[UNIT-STORE-STUDY-02] removes sessions absent from the latest snapshot while retaining other progress", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    startSession("deck-1", ["card-1"]);
    vi.setSystemTime(2000);
    startSession("deck-2", ["card-2", "card-3"]);
    const second = getStudySession("deck-2");
    if (!second) throw new Error("Missing second session");
    restoreStudySession({ ...second, currentIndex: 1 });
    const retained = getStudySession("deck-2");
    if (!retained) throw new Error("Missing retained session");

    setStudySessionOwner("uid");
    applyStudySessionSnapshot("uid", {
      values: [{ session: retained, endReason: null, endedAt: null }],
      fromCache: false,
    });

    expect(getStudySession("deck-1")).toBeUndefined();
    expect(getStudySession("deck-2")).toEqual(retained);
  });

  it("clears the visible session without deleting the legacy backup", () => {
    localStorage.setItem(STUDY_STORAGE_KEY, "legacy backup");
    startSession("deck-1", ["card-1"]);
    clearStudySessions();
    expect(getStudySession("deck-1")).toBeUndefined();
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBe("legacy backup");
  });
  it.each([false, true])(
    "[UNIT-STORE-STUDY-11] retains progress and reports sync errors to current and later history readers (loaded=%s)",
    async (loaded) => {
      const expected = loaded
        ? [
            {
              sessionId: "session-a",
              deckId: "deck-a",
              cardOrderIds: ["a1", "a2"],
              currentIndex: 0,
              lastStudiedAt: 100,
              remote: { uid: "uid", startedAt: 10, createdAt: 10 },
            },
            {
              sessionId: "session-b",
              deckId: "deck-b",
              cardOrderIds: ["b1", "b2", "b3"],
              currentIndex: 1,
              lastStudiedAt: 200,
              remote: { uid: "uid", startedAt: 20, createdAt: 20 },
            },
          ]
        : [];
      const stopInitial = subscribeStudySessions("uid", vi.fn());
      onTestFinished(stopInitial);
      const initial = await currentListener();
      initial.next({
        metadata: { fromCache: true, hasPendingWrites: false },
        docChanges: () =>
          expected.map((session) => ({
            type: "added",
            doc: {
              id: session.sessionId,
              metadata: { hasPendingWrites: false },
              data: () => ({
                uid: "uid",
                deckId: session.deckId,
                cardOrderIds: session.cardOrderIds,
                currentIndex: session.currentIndex,
                lastStudiedAt: session.lastStudiedAt,
                startedAt: Timestamp.fromMillis(session.remote.startedAt),
                createdAt: Timestamp.fromMillis(session.remote.createdAt),
                updatedAt: Timestamp.fromMillis(300),
                endedAt: null,
                endReason: null,
              }),
            },
          })),
      } as unknown as QuerySnapshot);
      const input = { uid: "uid", period: { start: 0, end: 1000 }, deckId: null, metric: "started" as const };
      const history = vi.fn();
      const historyError = vi.fn();
      onTestFinished(subscribeStudyHistory(input, history, historyError));
      expect(history).toHaveBeenLastCalledWith(
        expected.map((session) => ({
          sessionId: session.sessionId,
          deckId: session.deckId,
          startedAt: session.remote.startedAt,
          occurredAt: session.remote.startedAt,
          endedAt: null,
          endReason: null,
          cardCount: session.cardOrderIds.length,
        })),
        true
      );
      stopInitial();

      const failed = vi.fn();
      const ready = vi.fn();
      onTestFinished(subscribeStudySessions("uid", failed, ready));
      const listener = await currentListener();
      const { result } = renderHook(useRemoteStudySessionsLoading);
      expect(result.current).toBe(true);
      const error = new Error("Subscription unavailable");
      act(() => listener.error(error));

      expect(result.current).toBe(false);
      expect([getStudySession("deck-a"), getStudySession("deck-b")].filter(Boolean)).toEqual(expected);
      expect(failed).toHaveBeenCalledWith(error);
      expect(historyError).toHaveBeenCalledWith(error);
      expect(ready).not.toHaveBeenCalled();
      const lateHistory = vi.fn();
      const lateError = vi.fn();
      onTestFinished(subscribeStudyHistory(input, lateHistory, lateError));
      expect(lateError).toHaveBeenCalledWith(error);
      expect(lateHistory).not.toHaveBeenCalled();
    }
  );
});

const observer = vi.hoisted(() => ({
  current: undefined as { next: (snapshot: QuerySnapshot) => void; error: (error: Error) => void } | undefined,
}));

async function currentListener() {
  await vi.waitFor(() => {
    if (!observer.current) throw new Error("Waiting for subscription");
  });
  if (!observer.current) throw new Error("Missing subscription");
  return observer.current;
}

vi.mock("firebase/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/firestore")>()),
  onSnapshot: (
    _query: unknown,
    _options: unknown,
    next: (snapshot: QuerySnapshot) => void,
    error: (error: Error) => void
  ) => {
    const current = { next, error };
    observer.current = current;
    return () => {
      if (observer.current === current) observer.current = undefined;
    };
  },
}));

vi.mock("@/shared/firebase", async () => {
  const { initializeApp } = await import("firebase/app");
  const { getFirestore } = await import("firebase/firestore");
  return { db: getFirestore(initializeApp({ projectId: "unit-study-store" }, "unit-study-store")) };
});

afterAll(() => deleteApp(getApp("unit-study-store")));
