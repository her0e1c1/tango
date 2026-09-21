import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { useStudySessions } from "@/entities/study-session";
import { createCard, createDeck, createPreferences } from "@/test/factories";

import { useDeckListState } from "./useDeckListState";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", () => ({ useCards: vi.fn() }));
vi.mock("@/entities/deck", () => ({ useDecks: vi.fn() }));
vi.mock("@/entities/preference", () => ({ usePreferences: vi.fn() }));
vi.mock("@/entities/study-session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/study-session")>()),
  useStudySessions: vi.fn(),
}));

const now = Date.UTC(2026, 0, 1);

describe("DECK-NAVIGATION-12 DECK-NAVIGATION-13 live Deck review counts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.mocked(useDecks).mockReturnValue([createDeck()]);
    vi.mocked(useCards).mockReturnValue([createCard({ nextSeeingAt: new Date(now + 1000) })]);
    vi.mocked(useStudySessions).mockReturnValue({});
    vi.mocked(usePreferences).mockReturnValue(createPreferences({ useCardInterval: true }));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("reclassifies all Decks with one wake-up at the exact deadline and cleans up", () => {
    vi.mocked(useDecks).mockReturnValue([createDeck(), createDeck({ id: "second" })]);
    vi.mocked(useCards).mockReturnValue([
      createCard({ nextSeeingAt: new Date(now + 1000) }),
      createCard({ id: "second", deckId: "second", nextSeeingAt: new Date(now + 2000) }),
    ]);
    const { result, unmount } = renderHook(() => useDeckListState());
    expect(result.current.reviewSummary?.dueCardCount).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current.reviewSummary?.dueCardCount).toBe(0);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.reviewSummary?.dueCardCount).toBe(1);
    expect(result.current.reviewNow).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["focus", "visibilitychange"])("refreshes overdue counts on %s without waiting for an old timer", (event) => {
    const { result } = renderHook(() => useDeckListState());
    vi.setSystemTime(now + 2000);
    act(() => {
      if (event === "focus") window.dispatchEvent(new Event(event));
      else {
        vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
        document.dispatchEvent(new Event(event));
      }
    });
    expect(result.current.reviewSummary?.dueCardCount).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses current time after input and owner changes, without limiting or shuffling counts", () => {
    const { result, rerender } = renderHook(() => useDeckListState());
    vi.setSystemTime(now + 2000);
    vi.mocked(useCards).mockReturnValue([
      createCard({ uid: "next-user", nextSeeingAt: new Date(now + 1000) }),
      createCard({ id: "new", uid: "next-user" }),
    ]);
    vi.mocked(useDecks).mockReturnValue([createDeck({ uid: "next-user" })]);
    vi.mocked(usePreferences).mockReturnValue(
      createPreferences({ useCardInterval: true, maxNumberOfCardsToLearn: 1, shuffled: true })
    );
    rerender();
    expect(result.current.reviewSummary).toEqual({ dueCardCount: 1, newCardCount: 1 });
    vi.mocked(useDecks).mockReturnValue([createDeck({ uid: "next-user", selectedTags: ["missing"] })]);
    rerender();
    expect(result.current.reviewSummary).toEqual({ dueCardCount: 0, newCardCount: 0 });
    expect(result.current.reviewNow).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("removes the review summary and wake-up when scheduling is turned off", () => {
    const { result, rerender } = renderHook(() => useDeckListState());
    vi.mocked(usePreferences).mockReturnValue(createPreferences({ useCardInterval: false }));
    rerender();
    expect(result.current.reviewSummary).toBeUndefined();
    expect(result.current.other).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("waits safely for a distant deadline instead of repeatedly firing an overflowing timer", () => {
    const delay = 2 ** 31 + 1000;
    vi.mocked(useCards).mockReturnValue([createCard({ nextSeeingAt: new Date(now + delay) })]);
    const { result } = renderHook(() => useDeckListState());
    act(() => {
      vi.advanceTimersByTime(2 ** 31 - 1);
    });
    expect(result.current.reviewSummary?.dueCardCount).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
    act(() => {
      vi.advanceTimersByTime(1001);
    });
    expect(result.current.reviewSummary?.dueCardCount).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
