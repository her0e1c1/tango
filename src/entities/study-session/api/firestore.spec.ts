import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearStudySessions } from "../model/actions/clearStudySessions";
import { getStudySessionSyncStatus } from "../model/queries/getStudySessionSyncStatus";
import { subscribeStudySessions } from "./firestore";

const mocks = vi.hoisted(() => ({
  unsubscribe: vi.fn(),
  subscribe:
    vi.fn<
      (
        request: unknown,
        options: unknown,
        receive: (snapshot: { docs: never[]; metadata: { fromCache: boolean; hasPendingWrites: boolean } }) => void,
        fail: (error: Error) => void
      ) => () => void
    >(),
}));
vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/firestore")>()),
  collection: vi.fn(),
  where: vi.fn(),
  query: vi.fn(),
  onSnapshot: mocks.subscribe,
}));

describe("Study session synchronization [SWIPE-06] [SWIPE-08]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearStudySessions();
    mocks.subscribe.mockReturnValue(mocks.unsubscribe);
  });
  afterEach(() => clearStudySessions());

  it("leaves loading on subscription failure and delegates departure to the SDK", () => {
    const onError = vi.fn();
    const stop = subscribeStudySessions("uid", onError);
    expect(getStudySessionSyncStatus("uid")).toBe("loading");
    const error = new Error("permission denied");
    mocks.subscribe.mock.calls[0]?.[3](error);
    expect(getStudySessionSyncStatus("uid")).toBe("error");
    expect(onError).toHaveBeenCalledWith(error);
    stop();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
  });

  it("waits for confirmed data and does not share readiness with another account", () => {
    const stop = subscribeStudySessions("previous", vi.fn());
    const receive = mocks.subscribe.mock.calls[0]?.[2];
    if (receive === undefined) throw new Error("Expected a subscription");
    receive({ docs: [], metadata: { fromCache: true, hasPendingWrites: false } });
    expect(getStudySessionSyncStatus("previous")).toBe("loading");
    receive({ docs: [], metadata: { fromCache: false, hasPendingWrites: true } });
    expect(getStudySessionSyncStatus("previous")).toBe("loading");
    receive({ docs: [], metadata: { fromCache: false, hasPendingWrites: false } });
    expect(getStudySessionSyncStatus("previous")).toBe("ready");
    expect(getStudySessionSyncStatus("current")).toBe("loading");
    stop();
  });
});
