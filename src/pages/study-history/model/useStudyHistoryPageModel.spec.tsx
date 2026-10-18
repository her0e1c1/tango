import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { replaceAuthSession } from "@/entities/auth";
import { subscribeStudyAnswerHistory, type StudyAnswerHistory } from "@/entities/study-answer";
import { replaceRemoteDecks } from "@/test/utils/entityFixtures";
import { createDeck } from "@/test/factories";
import { useStudyHistoryPageModel } from "./useStudyHistoryPageModel";

vi.mock("@/shared/firebase", () => ({ db: {}, auth: {} }));
vi.mock("@/entities/study-answer", () => ({ subscribeStudyAnswerHistory: vi.fn() }));
vi.mock("@/entities/study-session", () => ({
  subscribeStudyHistory: vi.fn((_input, next) => {
    next([], false);
    return vi.fn();
  }),
}));
const subscriptions: {
  input: Parameters<typeof subscribeStudyAnswerHistory>[0];
  resolve: (value: StudyAnswerHistory) => void;
  reject: (error: Error) => void;
  stop: ReturnType<typeof vi.fn>;
}[] = [];
const empty: StudyAnswerHistory = {
  records: [],
  source: "server",
  truncated: false,
  invalidCount: 0,
  hasPendingWrites: false,
};
function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={["/study-history"]}>{children}</MemoryRouter>;
}

describe("STUDY-SESSION-13 answer history lifecycle", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    subscriptions.length = 0;
    vi.mocked(subscribeStudyAnswerHistory).mockImplementation((input, resolve, reject) => {
      const stop = vi.fn();
      subscriptions.push({ input, resolve, reject, stop });
      return stop;
    });
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: false, displayName: null });
    replaceRemoteDecks([createDeck({ id: "deck", uid: "uid" })]);
  });
  it("rejects stale Deck, period, UID and retry responses while retaining Session summaries", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderHook` with the prepared inputs.
    const { result } = renderHook(useStudyHistoryPageModel, { wrapper });
    // Then: Verify the expected result in the assertions below.
    expect(result.current.answerHistory.status).toBe("loading");
    // When: Exercise `act` with the prepared inputs.
    act(() => result.current.selectDeck("deck"));
    // Then: Verify the expected result in the assertions below.
    expect(subscriptions[0]?.stop).toHaveBeenCalledOnce();
    // When: Exercise `act` with the prepared inputs.
    act(() => subscriptions[0]?.resolve(empty));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.answerHistory.status).toBe("loading");
    // When: Exercise `act` with the prepared inputs.
    act(() => result.current.selectPeriod(7));
    // Then: Verify the expected result in the assertions below.
    expect(subscriptions[1]?.stop).toHaveBeenCalledOnce();
    // When: Exercise `act` with the prepared inputs.
    act(() => subscriptions[1]?.reject(new Error("old deck")));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.answerHistory.status).toBe("loading");
    // When: Exercise `act` with the prepared inputs.
    act(() => result.current.retry());
    act(() => subscriptions[2]?.resolve(empty));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.answerHistory.status).toBe("loading");
    // When: Exercise `act` with the prepared inputs.
    act(() => subscriptions[3]?.reject(new Error("offline")));
    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(result.current.answerHistory.status).toBe("error"));
    expect(result.current.status).toBe("ready");
    expect(result.current.summary).toMatchObject({ started: 0, completed: 0 });
    // When: Exercise `act` with the prepared inputs.
    act(() => result.current.retry());
    // Then: Verify the expected result in the assertions below.
    expect(subscriptions[4]?.input).toMatchObject({ uid: "uid", deckId: "deck", limit: 1000 });
    // When: Exercise `act` with the prepared inputs.
    act(() => replaceAuthSession({ status: "authenticated", uid: "next", isAnonymous: false, displayName: null }));
    act(() => replaceRemoteDecks([createDeck({ id: "deck", uid: "next" })]));
    act(() => subscriptions[4]?.resolve(empty));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.answerHistory.status).toBe("loading");
    // When: Exercise `act` with the prepared inputs.
    act(() => subscriptions[5]?.resolve(empty));
    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(result.current.answerHistory.status).toBe("empty"));
    expect(subscriptions[5]?.input.uid).toBe("next");
  });
  it.each([
    ["cache-limited", { source: "cache" as const }],
    ["truncated", { truncated: true }],
    ["incomplete", { invalidCount: 1 }],
    ["empty", {}],
  ])("distinguishes %s without resubscribing unchanged criteria", async (status, metadata) => {
    // Given: Use this case's inputs and any shared test setup.
    const { result, rerender } = renderHook(useStudyHistoryPageModel, { wrapper });
    // When: Exercise `act` with the prepared inputs.
    act(() => subscriptions[0]?.resolve({ ...empty, ...metadata }));
    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(result.current.answerHistory.status).toBe(status));
    expect(result.current.answerHistory.summary?.recallRate).toBeUndefined();
    // When: Exercise `rerender` with the prepared inputs.
    rerender();
    // Then: Verify the expected result in the assertions below.
    expect(subscriptions).toHaveLength(1);
  });
  it("updates the visible summary from successive snapshots and ignores notifications after unmount", () => {
    // Given: Prepare `subscription`, `history` and any shared test state below.
    const { result, unmount } = renderHook(useStudyHistoryPageModel, { wrapper });
    const subscription = subscriptions[0];
    if (!subscription) throw new Error("Missing subscription");
    const history = {
      ...empty,
      source: "cache" as const,
      hasPendingWrites: true,
      records: [
        {
          id: "answer",
          deckId: "deck",
          sessionId: "session",
          answeredAt: subscription.input.from,
          rating: "good" as const,
        },
      ],
    };
    // When: Exercise `act` with the prepared inputs.
    act(() => subscription.resolve(history));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.answerHistory.status).toBe("cache-limited");
    expect(result.current.answerHistory.summary).toMatchObject({ ratedAnswerCount: 1, hasPendingWrites: true });
    // When: Exercise `act` with the prepared inputs.
    act(() => subscription.resolve({ ...history, source: "server", hasPendingWrites: false }));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.answerHistory.status).toBe("ready");
    expect(result.current.answerHistory.summary).toMatchObject({ ratedAnswerCount: 1, hasPendingWrites: false });
    // When: Exercise `unmount` with the prepared inputs.
    unmount();
    // Then: Verify the expected result in the assertions below.
    expect(subscription.stop).toHaveBeenCalledOnce();
    // When: Exercise `act` with the prepared inputs.
    act(() => subscription.resolve(empty));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.answerHistory.summary?.ratedAnswerCount).toBe(1);
  });
  it("handles synchronous subscription failures without breaking the Page", () => {
    // Given: Use this case's inputs and any shared test setup.
    vi.mocked(subscribeStudyAnswerHistory).mockImplementationOnce(() => {
      throw new Error("Owner changed");
    });
    // When: Exercise `renderHook` with the prepared inputs.
    const { result } = renderHook(useStudyHistoryPageModel, { wrapper });
    // Then: Verify the expected result in the assertions below.
    expect(result.current.answerHistory.status).toBe("error");
    expect(result.current.status).toBe("ready");
  });
});
