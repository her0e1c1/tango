import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { replaceAuthSession } from "@/entities/auth";
import { subscribeStudyAnswerHistory, type StudyAnswerHistory } from "@/entities/study-answer";
import { replaceRemoteDecks } from "@/test/entityFixtures";
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
    const { result } = renderHook(useStudyHistoryPageModel, { wrapper });
    expect(result.current.answerHistory.status).toBe("loading");
    act(() => result.current.selectDeck("deck"));
    expect(subscriptions[0]?.stop).toHaveBeenCalledOnce();
    act(() => subscriptions[0]?.resolve(empty));
    expect(result.current.answerHistory.status).toBe("loading");
    act(() => result.current.selectPeriod(7));
    expect(subscriptions[1]?.stop).toHaveBeenCalledOnce();
    act(() => subscriptions[1]?.reject(new Error("old deck")));
    expect(result.current.answerHistory.status).toBe("loading");
    act(() => result.current.retry());
    act(() => subscriptions[2]?.resolve(empty));
    expect(result.current.answerHistory.status).toBe("loading");
    act(() => subscriptions[3]?.reject(new Error("offline")));
    await waitFor(() => expect(result.current.answerHistory.status).toBe("error"));
    expect(result.current.status).toBe("ready");
    expect(result.current.summary).toMatchObject({ started: 0, completed: 0 });
    act(() => result.current.retry());
    expect(subscriptions[4]?.input).toMatchObject({ uid: "uid", deckId: "deck", limit: 1000 });
    act(() => replaceAuthSession({ status: "authenticated", uid: "next", isAnonymous: false, displayName: null }));
    act(() => replaceRemoteDecks([createDeck({ id: "deck", uid: "next" })]));
    act(() => subscriptions[4]?.resolve(empty));
    expect(result.current.answerHistory.status).toBe("loading");
    act(() => subscriptions[5]?.resolve(empty));
    await waitFor(() => expect(result.current.answerHistory.status).toBe("empty"));
    expect(subscriptions[5]?.input.uid).toBe("next");
  });
  it.each([
    ["cache-limited", { source: "cache" as const }],
    ["truncated", { truncated: true }],
    ["incomplete", { invalidCount: 1 }],
    ["empty", {}],
  ])("distinguishes %s without resubscribing unchanged criteria", async (status, metadata) => {
    const { result, rerender } = renderHook(useStudyHistoryPageModel, { wrapper });
    act(() => subscriptions[0]?.resolve({ ...empty, ...metadata }));
    await waitFor(() => expect(result.current.answerHistory.status).toBe(status));
    expect(result.current.answerHistory.summary?.recallRate).toBeUndefined();
    rerender();
    expect(subscriptions).toHaveLength(1);
  });
  it("updates the visible summary from successive snapshots and ignores notifications after unmount", () => {
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
    act(() => subscription.resolve(history));
    expect(result.current.answerHistory.status).toBe("cache-limited");
    expect(result.current.answerHistory.summary).toMatchObject({ ratedAnswerCount: 1, hasPendingWrites: true });
    act(() => subscription.resolve({ ...history, source: "server", hasPendingWrites: false }));
    expect(result.current.answerHistory.status).toBe("ready");
    expect(result.current.answerHistory.summary).toMatchObject({ ratedAnswerCount: 1, hasPendingWrites: false });
    unmount();
    expect(subscription.stop).toHaveBeenCalledOnce();
    act(() => subscription.resolve(empty));
    expect(result.current.answerHistory.summary?.ratedAnswerCount).toBe(1);
  });
  it("handles synchronous subscription failures without breaking the Page", () => {
    vi.mocked(subscribeStudyAnswerHistory).mockImplementationOnce(() => {
      throw new Error("Owner changed");
    });
    const { result } = renderHook(useStudyHistoryPageModel, { wrapper });
    expect(result.current.answerHistory.status).toBe("error");
    expect(result.current.status).toBe("ready");
  });
});
