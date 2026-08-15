import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createDeck, createPreferences, createStudyProgress } from "@/test/factories";
import type { StudyProgress } from "@/entities/study-progress";

const mocks = vi.hoisted(() => ({ progresses: [] as StudyProgress[] }));

vi.mock("@/entities/study-progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/study-progress")>();
  return { ...actual, useStudyProgresses: () => mocks.progresses };
});
import { useFilteredStudyCards } from "./useFilteredStudyCards";

describe("useFilteredStudyCards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.progresses = [];
  });

  afterEach(() => vi.useRealTimers());

  it("composes deck filters and scheduling rules", () => {
    const now = Date.UTC(2026, 6, 19);
    vi.spyOn(Date, "now").mockReturnValue(now);
    const deck = createDeck({ id: "deck" });
    const available = createCard({ id: "available", deckId: deck.id });
    const future = createCard({ id: "future", deckId: deck.id });
    const availableProgress = createStudyProgress({ cardId: available.id, nextSeeingAt: new Date(now) });
    const futureProgress = createStudyProgress({ cardId: future.id, nextSeeingAt: new Date(now + 1) });
    mocks.progresses = [availableProgress, futureProgress];

    const { result } = renderHook(() =>
      useFilteredStudyCards(deck, [available, future], createPreferences({ useCardInterval: true }))
    );

    expect(result.current).toEqual([{ card: available, progress: availableProgress }]);
  });

  it("returns no cards when the deck is unavailable", () => {
    const cards = [createCard({ deckId: "missing" })];
    const { result } = renderHook(() => useFilteredStudyCards(undefined, cards, createPreferences()));
    expect(result.current).toEqual([]);
  });

  it("does not make a Card selectable before its StudyProgress is available", () => {
    const deck = createDeck({ id: "deck" });
    const card = createCard({ id: "loading", deckId: deck.id });

    expect(renderHook(() => useFilteredStudyCards(deck, [card], createPreferences())).result.current).toEqual([]);
  });

  it("re-evaluates scheduled cards when their next review time arrives", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const deck = createDeck({ id: "scheduled" });
    const card = createCard({ id: "scheduled-card", deckId: deck.id });
    const progress = createStudyProgress({ cardId: card.id, nextSeeingAt: new Date(1_500) });
    mocks.progresses = [progress];
    const { result } = renderHook(() => ({
      enabled: useFilteredStudyCards(deck, [card], createPreferences({ useCardInterval: true })),
      disabled: useFilteredStudyCards(deck, [card], createPreferences({ useCardInterval: false })),
    }));

    expect(result.current.enabled).toEqual([]);
    expect(result.current.disabled).toEqual([{ card, progress }]);
    act(() => vi.advanceTimersByTime(499));
    expect(result.current.enabled).toEqual([]);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.enabled).toEqual([{ card, progress }]);
  });

  it("reschedules review times beyond the browser timeout limit", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const maxTimeout = 2_147_483_647;
    const deck = createDeck({ id: "scheduled" });
    const card = createCard({
      id: "scheduled-card",
      deckId: deck.id,
    });
    const progress = createStudyProgress({
      cardId: card.id,
      nextSeeingAt: new Date(1_000 + maxTimeout + 500),
    });
    mocks.progresses = [progress];
    const config = createPreferences({ useCardInterval: true });
    const { result } = renderHook(() => useFilteredStudyCards(deck, [card], config));

    expect(result.current).toEqual([]);
    act(() => vi.advanceTimersByTime(maxTimeout));
    expect(result.current).toEqual([]);
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toEqual([{ card, progress }]);
  });
});
