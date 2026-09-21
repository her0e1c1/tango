import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearStudySessions } from "../model/actions/clearStudySessions";
import { startStudy } from "../model/actions/startStudy";
import { getStudySession } from "../model/queries/getStudySession";
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

describe("Study session synchronization [STUDY-SESSION-01] [STUDY-SESSION-03] [STUDY-SESSION-07] [PERSISTENCE-04]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearStudySessions();
    mocks.subscribe.mockReturnValue(mocks.unsubscribe);
  });
  afterEach(() => clearStudySessions());

  it("reports subscription failure and delegates departure to the SDK", () => {
    const onError = vi.fn();
    const stop = subscribeStudySessions("uid", onError);
    const error = new Error("permission denied");
    mocks.subscribe.mock.calls[0]?.[3](error);
    expect(onError).toHaveBeenCalledWith(error);
    stop();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
  });
  it("clears the previous account's cloud sessions while retaining local study", () => {
    const cards = [{ id: "card", numberOfSeen: 0, difficulty: 5 }];
    const preferences = { shuffled: false, maxNumberOfCardsToLearn: 0 };
    startStudy("remote", cards, preferences, "previous");
    startStudy("local", cards, preferences);
    const local = getStudySession("local");
    const stop = subscribeStudySessions("current", vi.fn());
    expect(getStudySession("remote")).toBeUndefined();
    mocks.subscribe.mock.calls[0]?.[2]({
      docs: [],
      metadata: { fromCache: false, hasPendingWrites: false },
    });
    expect(getStudySession("local")).toEqual(local);
    stop();
  });
});
