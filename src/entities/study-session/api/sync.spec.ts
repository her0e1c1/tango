import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearStudySessions } from "../model/actions/clearStudySessions";
import { getStudySessionSyncStatus } from "../model/queries/getStudySessionSyncStatus";
import { subscribeStudySessions } from "./firestore";
import { syncStudySessions } from "./sync";

vi.mock("./firestore", () => ({ subscribeStudySessions: vi.fn(() => () => undefined) }));

describe("Study session synchronization [SWIPE-08]", () => {
  let stop: (() => void) | undefined;
  let failSubscription: (error: Error) => void;
  beforeEach(() => {
    vi.resetAllMocks();
    clearStudySessions();
    vi.mocked(subscribeStudySessions).mockImplementation((_uid, _onChange, onError) => {
      failSubscription = onError;
      return () => undefined;
    });
  });
  afterEach(() => {
    stop?.();
    clearStudySessions();
  });

  it("leaves loading on subscription failure and ignores callbacks after departure", () => {
    const onError = vi.fn();
    stop = syncStudySessions("uid", onError);
    expect(getStudySessionSyncStatus("uid")).toBe("loading");
    const error = new Error("permission denied");
    failSubscription(error);
    expect(getStudySessionSyncStatus("uid")).toBe("error");
    expect(onError).toHaveBeenCalledWith(error);
    stop();
    clearStudySessions();
    failSubscription(error);
    expect(getStudySessionSyncStatus()).toBe("idle");
  });

  it("does not treat the previous account's subscription as ready for a new account", () => {
    vi.mocked(subscribeStudySessions).mockImplementation((_uid, onChange) => {
      onChange([]);
      return () => undefined;
    });
    stop = syncStudySessions("previous", vi.fn());
    expect(getStudySessionSyncStatus("previous")).toBe("ready");
    expect(getStudySessionSyncStatus("current")).toBe("loading");
  });
});
