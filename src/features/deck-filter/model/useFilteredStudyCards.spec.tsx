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
    vi.setSystemTime(1000);
    const deck = createDeck({ id: "scheduled" });
    const next = createCard({ id: "next", deckId: deck.id, nextSeeingAt: new Date(1500) });
    const later = createCard({ id: "later", deckId: deck.id, nextSeeingAt: new Date(2000) });
    const cards = [next, later];
    const { result } = renderHook(() => ({
      enabled: useFilteredStudyCards(deck, cards, createPreferences({ useCardInterval: true })),
      disabled: useFilteredStudyCards(deck, cards, createPreferences({ useCardInterval: false })),
    }));

    expect(result.current.enabled).toEqual([]);
    expect(result.current.disabled).toEqual(cards);
    act(() => vi.advanceTimersByTime(499));
    expect(result.current.enabled).toEqual([]);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.enabled).toEqual([next]);
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.enabled).toEqual(cards);
  });

  it("re-evaluates a changed card list against the current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const deck = createDeck({ id: "scheduled" });
    const initial = createCard({ id: "initial", deckId: deck.id, nextSeeingAt: new Date(2000) });
    const current = createCard({ id: "current", deckId: deck.id, nextSeeingAt: new Date(1500) });
    const preferences = createPreferences({ useCardInterval: true });
    const { result, rerender } = renderHook(({ cards }) => useFilteredStudyCards(deck, cards, preferences), {
      initialProps: { cards: [initial] },
    });

    vi.setSystemTime(1600);
    rerender({ cards: [current] });
    act(() => vi.advanceTimersByTime(0));

    expect(result.current).toEqual([current]);
  });

  it("reschedules review times beyond the browser timeout limit", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const maxTimeout = 2_147_483_647;
    const deck = createDeck({ id: "scheduled" });
    const card = createCard({
      id: "scheduled-card",
      deckId: deck.id,
      nextSeeingAt: new Date(1000 + maxTimeout + 500),
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
