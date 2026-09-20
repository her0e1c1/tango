import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { abandonStudySession } from "../model/actions/abandonStudySession";
import { clearStudySessions } from "../model/actions/clearStudySessions";
import { setStudySessionIndex } from "../model/actions/setStudySessionIndex";
import { startStudy } from "../model/actions/startStudy";
import { getStudySession } from "../model/queries/getStudySession";
import type { StudySessionWrite } from "../model/types";
import { saveStudySession, subscribeStudySessions } from "./firestore";
import { syncStudySessions } from "./sync";
import { getStudySessionSyncStatus } from "../model/queries/getStudySessionSyncStatus";

vi.mock("./firestore", () => ({
  saveStudySession: vi.fn(),
  subscribeStudySessions: vi.fn(() => () => undefined),
}));

const cards = ["first", "second"].map((id, numberOfSeen) => ({ id, numberOfSeen, difficulty: 5 }));
const preferences = { shuffled: false, maxNumberOfCardsToLearn: 0 };

describe("Study session synchronization [PERSIST-02] [SWIPE-08] [SWIPE-09] [SWIPE-10]", () => {
  let stop: (() => void) | undefined;
  const saved = new Map<string, StudySessionWrite>();
  let failSubscription: (error: Error) => void;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    clearStudySessions();
    saved.clear();
    vi.mocked(subscribeStudySessions).mockImplementation((_uid, _onChange, onError) => {
      failSubscription = onError;
      return () => undefined;
    });
    vi.mocked(saveStudySession).mockImplementation((_uid, write) => {
      saved.set(write.session.sessionId, write);
      return Promise.resolve(write);
    });
  });

  it("leaves the loading state when the cloud subscription fails", () => {
    const onError = vi.fn();
    stop = syncStudySessions("uid", onError);
    expect(getStudySessionSyncStatus()).toBe("loading");
    const error = new Error("permission denied");
    failSubscription(error);
    expect(getStudySessionSyncStatus()).toBe("error");
    expect(onError).toHaveBeenCalledWith(error);
    stop();
    clearStudySessions();
    failSubscription(error);
    expect(getStudySessionSyncStatus()).toBe("idle");
  });

  afterEach(() => {
    stop?.();
    clearStudySessions();
    vi.useRealTimers();
  });

  it("retries failed progress with the same identity and preserves a newer terminal write", async () => {
    const onError = vi.fn();
    vi.mocked(saveStudySession).mockRejectedValueOnce(new Error("offline"));
    stop = syncStudySessions("uid", onError);
    startStudy("deck", cards, preferences, "uid");
    const session = getStudySession("deck");
    if (session === undefined) throw new Error("Expected a session");
    await vi.advanceTimersByTimeAsync(0);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    setStudySessionIndex("deck", 1);
    abandonStudySession("deck");
    await vi.advanceTimersByTimeAsync(1000);
    expect([...saved.keys()]).toEqual([session.sessionId]);
    expect(saved.get(session.sessionId)).toMatchObject({ session: { currentIndex: 1 }, endReason: "abandoned" });
    expect(getStudySession("deck")).toBeUndefined();
  });

  it("does not erase progress made while an earlier save was pending", async () => {
    let finish: ((write: StudySessionWrite) => void) | undefined;
    vi.mocked(saveStudySession).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    stop = syncStudySessions("uid", vi.fn());
    startStudy("deck", cards, preferences, "uid");
    const session = getStudySession("deck");
    if (session === undefined) throw new Error("Expected a session");
    setStudySessionIndex("deck", 1);
    finish?.({ session, endReason: null });
    await vi.advanceTimersByTimeAsync(0);
    expect(saved.get(session.sessionId)?.session.currentIndex).toBe(1);
    expect(getStudySession("deck")?.currentIndex).toBe(1);
  });

  it("keeps a failed write available after leaving and resubscribing", async () => {
    vi.mocked(saveStudySession).mockRejectedValueOnce(new Error("offline"));
    stop = syncStudySessions("uid", vi.fn());
    startStudy("deck", cards, preferences, "uid");
    const sessionId = getStudySession("deck")?.sessionId;
    await vi.advanceTimersByTimeAsync(0);
    stop();
    stop = syncStudySessions("uid", vi.fn());
    await vi.advanceTimersByTimeAsync(0);
    expect([...saved.keys()]).toEqual([sessionId]);
    expect(getStudySession("deck")?.sessionId).toBe(sessionId);
  });
});
