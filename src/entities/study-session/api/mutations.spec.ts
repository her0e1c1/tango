import "@/test/mockFirestorePersistence";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearStudySessions } from "../model/actions/clearStudySessions";
import { getStudySession } from "../model/queries/getStudySession";
import { startStudy, setStudySessionIndex, moveStudySession, touchStudySession } from "./mutations";
import { studySessionStore } from "../model/store";

const auth = vi.hoisted(() => ({ uid: "owner" }));
vi.mock("@/entities/auth/@x/study-session", () => ({ getAuthUid: () => auth.uid }));

import { startStudy as seedStudy } from "@/test/entityFixtures";
import * as firestore from "./firestore";

const persistence = { create: vi.spyOn(firestore, "createStudySession") };

describe("Study start and restart [STUDY-SESSION-01] [STUDY-SESSION-04]", () => {
  beforeEach(() => {
    auth.uid = "owner";
    clearStudySessions();
    persistence.create.mockReset().mockImplementation(async (session: import("../model/types").StudySession) => {
      await Promise.resolve();
      studySessionStore.setState((state) => {
        state.sessionsByDeckId[session.deckId] = session;
      });
    });
  });
  it("preserves the prior run and cursor when a replacement cannot be saved locally", async () => {
    const cardOrderIds = ["first", "second"];
    await startStudy({ deckId: "deck", cardOrderIds, uid: "owner" });
    await setStudySessionIndex("deck", 1);
    const previous = getStudySession("deck");
    const pending = Promise.withResolvers<void>();
    persistence.create.mockReturnValueOnce(pending.promise);
    const restart = startStudy({ deckId: "deck", cardOrderIds, uid: "owner" });
    expect(getStudySession("deck")).toEqual(previous);
    const rejected = restart.catch((error: unknown) => error);
    pending.reject(new Error("Persistence quota exceeded"));
    expect(await rejected).toEqual(new Error("Persistence quota exceeded"));
    expect(getStudySession("deck")).toEqual(previous);
    await startStudy({ deckId: "deck", cardOrderIds, uid: "owner" });
    expect(getStudySession("deck")).toMatchObject({ currentIndex: 0, cardOrderIds: ["first", "second"] });
    expect(getStudySession("deck")?.sessionId).not.toBe(previous?.sessionId);
  });
  it("starts at index zero with the configured card order", async () => {
    const cardOrderIds = ["third", "second"];
    await startStudy({ deckId: "deck", cardOrderIds, uid: "owner" });

    expect(getStudySession("deck")?.currentIndex).toBe(0);
    expect(getStudySession("deck")?.cardOrderIds).toEqual(["third", "second"]);
  });

  it("copies the card order into the session", async () => {
    const cardOrderIds = ["first", "second"];
    await startStudy({ deckId: "deck", cardOrderIds, uid: "owner" });
    cardOrderIds.reverse();

    expect(getStudySession("deck")?.cardOrderIds).toEqual(["first", "second"]);
  });
});

describe("Study session operations [STUDY-SESSION-01] [STUDY-ACTIONS-04] [STUDY-ACTIONS-05]", () => {
  const startSession = (deckId: string, cardOrderIds: string[]) =>
    seedStudy(
      deckId,
      cardOrderIds.map((id) => ({ id })),
      { shuffled: false, maxNumberOfCardsToLearn: 0 },
      "owner"
    );

  beforeEach(() => {
    auth.uid = "owner";
    clearStudySessions();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    clearStudySessions();
  });
  it("updates only the requested session and its last studied time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    startSession("deck-1", ["card-1", "card-2"]);
    startSession("deck-2", ["card-3", "card-4"]);

    vi.setSystemTime(3000);
    await setStudySessionIndex("deck-1", 1);

    expect(studySessionStore.getState().sessionsByDeckId["deck-1"]).toMatchObject({
      currentIndex: 1,
      lastStudiedAt: 3000,
    });
    expect(studySessionStore.getState().sessionsByDeckId["deck-2"]).toMatchObject({
      currentIndex: 0,
      lastStudiedAt: 1000,
    });
  });

  it("moves within a session and removes it when movement reaches an edge", async () => {
    startSession("deck-1", ["card-1", "card-2"]);
    const firstCard = getStudySession("deck-1");
    if (firstCard == null) throw new Error("Expected an active study session");

    expect(await moveStudySession(firstCard)).toBe(true);
    expect(getStudySession("deck-1")?.currentIndex).toBe(1);

    const finalCard = getStudySession("deck-1");
    if (finalCard == null) throw new Error("Expected an active study session");
    expect(await moveStudySession(finalCard)).toBe(true);
    expect(getStudySession("deck-1")).toBeUndefined();
  });

  it("moves only when the persisted swipe still owns the active card", async () => {
    startSession("deck-1", ["card-1", "card-2"]);
    const previous = getStudySession("deck-1");
    if (previous == null) throw new Error("Expected an active study session");

    await touchStudySession("deck-1");
    expect(await moveStudySession(previous)).toBe(true);
    expect(getStudySession("deck-1")?.currentIndex).toBe(1);

    expect(await moveStudySession(previous)).toBe(false);
    expect(getStudySession("deck-1")?.currentIndex).toBe(1);
  });

  it("does not move a replacement session that starts on the same card", async () => {
    startSession("deck-1", ["card-1", "card-2"]);
    const previous = getStudySession("deck-1");
    if (previous == null) throw new Error("Expected an active study session");

    startSession("deck-1", ["card-1", "card-2"]);
    const replacement = getStudySession("deck-1");

    expect(replacement?.sessionId).not.toBe(previous.sessionId);
    expect(await moveStudySession(previous)).toBe(false);
    expect(getStudySession("deck-1")?.currentIndex).toBe(0);
  });

  it.each([-1, 2, 0.5])("does not persist an invalid session index: %s", async (currentIndex) => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    startSession("deck-1", ["card-1", "card-2"]);

    vi.setSystemTime(3000);
    await setStudySessionIndex("deck-1", currentIndex);

    expect(studySessionStore.getState().sessionsByDeckId["deck-1"]).toMatchObject({
      currentIndex: 0,
      lastStudiedAt: 1000,
    });
  });

  it("keeps the current Card and persisted resume point when asked to move backward", async () => {
    startSession("deck-1", ["card-1", "card-2", "card-3"]);
    await setStudySessionIndex("deck-1", 1);
    const session = getStudySession("deck-1");
    const persisted = localStorage.getItem("tango-study");

    expect(await setStudySessionIndex("deck-1", 0)).toBe(false);
    expect(getStudySession("deck-1")).toEqual(session);
    expect(localStorage.getItem("tango-study")).toBe(persisted);
    expect(await setStudySessionIndex("deck-1", 2)).toBe(true);
    expect(getStudySession("deck-1")?.currentIndex).toBe(2);
  });

  it("touches only an existing requested session", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    startSession("deck-1", ["card-1"]);

    vi.setSystemTime(4000);
    await touchStudySession("deck-1");
    await touchStudySession("missing-deck");

    expect(studySessionStore.getState().sessionsByDeckId["deck-1"]?.lastStudiedAt).toBe(4000);
    expect(studySessionStore.getState().sessionsByDeckId).not.toHaveProperty("missing-deck");
  });
  it.each(["index", "move", "touch"] as const)("rejects %s after the owner changes", async (operation) => {
    startSession("deck-1", ["card-1", "card-2"]);
    const session = getStudySession("deck-1");
    if (!session) throw new Error("Expected an active study session");
    auth.uid = "other-owner";
    const result =
      operation === "index"
        ? setStudySessionIndex("deck-1", 1)
        : operation === "move"
          ? moveStudySession(session)
          : touchStudySession("deck-1");
    await expect(result).rejects.toThrow("Study session owner changed");
    expect(getStudySession("deck-1")).toEqual(session);
  });

  it.each(["index", "move", "complete", "touch"] as const)(
    "propagates a failed %s write without changing the session",
    async (operation) => {
      startSession("deck-1", operation === "complete" ? ["card-1"] : ["card-1", "card-2"]);
      const session = getStudySession("deck-1");
      if (!session) throw new Error("Expected an active study session");
      const write = vi.spyOn(firestore, operation === "touch" ? "updateStudySessionRecency" : "updateStudySession");
      write.mockRejectedValueOnce(new Error("Persistence quota exceeded"));
      const result =
        operation === "index"
          ? setStudySessionIndex("deck-1", 1)
          : operation === "touch"
            ? touchStudySession("deck-1")
            : moveStudySession(session);
      await expect(result).rejects.toThrow("Persistence quota exceeded");
      expect(getStudySession("deck-1")).toEqual(session);
    }
  );
});

vi.mock("@/shared/firebase", () => ({ db: {} }));
