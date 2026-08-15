import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createDeck, createPreferences } from "@/test/factories";
import { useFilteredStudyCards } from "./useFilteredStudyCards";

describe("useFilteredStudyCards", () => {
  beforeEach(() => vi.restoreAllMocks());

  afterEach(() => vi.useRealTimers());

  it("composes deck filters and scheduling rules", () => {
    const now = Date.UTC(2026, 6, 19);
    vi.spyOn(Date, "now").mockReturnValue(now);
    const deck = createDeck({ id: "deck" });
    const available = createCard({ id: "available", deckId: deck.id, nextSeeingAt: new Date(now) });
    const future = createCard({ id: "future", deckId: deck.id, nextSeeingAt: new Date(now + 1) });

    const { result } = renderHook(() =>
      useFilteredStudyCards(deck, [available, future], createPreferences({ useCardInterval: true }))
    );

    expect(result.current).toEqual([available]);
  });

  it("returns no cards when the deck is unavailable", () => {
    const cards = [createCard({ deckId: "missing" })];
    const { result } = renderHook(() => useFilteredStudyCards(undefined, cards, createPreferences()));
    expect(result.current).toEqual([]);
  });

  it("re-evaluates scheduled cards when their next review time arrives", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const deck = createDeck({ id: "scheduled" });
    const card = createCard({ id: "scheduled-card", deckId: deck.id, nextSeeingAt: new Date(1_500) });
    const { result } = renderHook(() => ({
      enabled: useFilteredStudyCards(deck, [card], createPreferences({ useCardInterval: true })),
      disabled: useFilteredStudyCards(deck, [card], createPreferences({ useCardInterval: false })),
    }));

    expect(result.current.enabled).toEqual([]);
    expect(result.current.disabled).toEqual([card]);
    act(() => vi.advanceTimersByTime(499));
    expect(result.current.enabled).toEqual([]);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.enabled).toEqual([card]);
  });

  it("reschedules review times beyond the browser timeout limit", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const maxTimeout = 2_147_483_647;
    const deck = createDeck({ id: "scheduled" });
    const card = createCard({
      id: "scheduled-card",
      deckId: deck.id,
      nextSeeingAt: new Date(1_000 + maxTimeout + 500),
    });
    const { result } = renderHook(() =>
      useFilteredStudyCards(deck, [card], createPreferences({ useCardInterval: true }))
    );

    expect(result.current).toEqual([]);
    act(() => vi.advanceTimersByTime(maxTimeout));
    expect(result.current).toEqual([]);
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toEqual([card]);
  });
});
