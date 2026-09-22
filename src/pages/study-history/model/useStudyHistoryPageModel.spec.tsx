import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { replaceAuthSession } from "@/entities/auth";
import { readStudyAnswerHistory, type StudyAnswerHistory } from "@/entities/study-answer";
import { replaceRemoteDecks } from "@/test/entityFixtures";
import { createDeck } from "@/test/factories";
import { useStudyHistoryPageModel } from "./useStudyHistoryPageModel";

vi.mock("@/shared/firebase", () => ({ db: {}, auth: {} }));
vi.mock("@/entities/study-answer", () => ({ readStudyAnswerHistory: vi.fn() }));
vi.mock("@/entities/study-session", () => ({
  subscribeStudyHistory: vi.fn((_input, next) => {
    next([], false);
    return vi.fn();
  }),
}));
const reads: {
  input: Parameters<typeof readStudyAnswerHistory>[0];
  resolve: (value: StudyAnswerHistory) => void;
  reject: (error: Error) => void;
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
    reads.length = 0;
    vi.mocked(readStudyAnswerHistory).mockImplementation(
      (input) =>
        new Promise((resolve, reject) => {
          reads.push({ input, resolve, reject });
        })
    );
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: false, displayName: null });
    replaceRemoteDecks([createDeck({ id: "deck", uid: "uid" })]);
  });
  it("rejects stale Deck, period, UID and retry responses while retaining Session summaries", async () => {
    const { result } = renderHook(useStudyHistoryPageModel, { wrapper });
    expect(result.current.answerHistory.status).toBe("loading");
    act(() => result.current.selectDeck("deck"));
    act(() => reads[0]?.resolve(empty));
    expect(result.current.answerHistory.status).toBe("loading");
    act(() => result.current.selectPeriod(7));
    act(() => reads[1]?.reject(new Error("old deck")));
    expect(result.current.answerHistory.status).toBe("loading");
    act(() => result.current.retry());
    act(() => reads[2]?.resolve(empty));
    expect(result.current.answerHistory.status).toBe("loading");
    act(() => reads[3]?.reject(new Error("offline")));
    await waitFor(() => expect(result.current.answerHistory.status).toBe("error"));
    expect(result.current.status).toBe("ready");
    expect(result.current.summary).toMatchObject({ started: 0, completed: 0 });
    act(() => result.current.retry());
    expect(reads[4]?.input).toMatchObject({ uid: "uid", deckId: "deck", limit: 1000 });
    act(() => replaceAuthSession({ status: "authenticated", uid: "next", isAnonymous: false, displayName: null }));
    act(() => replaceRemoteDecks([createDeck({ id: "deck", uid: "next" })]));
    act(() => reads[4]?.resolve(empty));
    expect(result.current.answerHistory.status).toBe("loading");
    act(() => reads[5]?.resolve(empty));
    await waitFor(() => expect(result.current.answerHistory.status).toBe("empty"));
    expect(reads[5]?.input.uid).toBe("next");
  });
  it.each([
    ["cache-limited", { source: "cache" as const }],
    ["truncated", { truncated: true }],
    ["incomplete", { invalidCount: 1 }],
    ["empty", {}],
  ])("distinguishes %s without rereading unchanged criteria", async (status, metadata) => {
    const { result, rerender } = renderHook(useStudyHistoryPageModel, { wrapper });
    act(() => reads[0]?.resolve({ ...empty, ...metadata }));
    await waitFor(() => expect(result.current.answerHistory.status).toBe(status));
    expect(result.current.answerHistory.summary?.recallRate).toBeUndefined();
    rerender();
    expect(reads).toHaveLength(1);
  });
});
