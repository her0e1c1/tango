import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createConfig, createDeck } from "@/test/factories";
import { createStudyProgressFromCard } from "@/entities/study-progress";

import { useStudyCards } from "@/features/study/hooks/useStudyCards";

describe("useStudyCards", () => {
  const progressFor = (cards: ReturnType<typeof createCard>[]) =>
    Object.fromEntries(cards.map((card) => [card.id, createStudyProgressFromCard(card)]));
  beforeEach(() => vi.restoreAllMocks());

  afterEach(() => {
    vi.useRealTimers();
  });

  it("composes Deck, Card, config, and scheduling rules", () => {
    const now = Date.UTC(2026, 6, 19);
    vi.spyOn(Date, "now").mockReturnValue(now);
    const deck = createDeck({ id: "deck" });
    const available = createCard({ id: "available", deckId: deck.id, nextSeeingAt: new Date(now) });
    const future = createCard({ id: "future", deckId: deck.id, nextSeeingAt: new Date(now + 1) });
    const cards = [available, future];

    const { result } = renderHook(() =>
      useStudyCards(deck, cards, progressFor(cards), createConfig({ useCardInterval: true }))
    );

    expect(result.current).toEqual([available]);
  });

  it("returns no Cards when the Deck is unavailable", () => {
    const cards = [createCard({ deckId: "missing" })];

    const { result } = renderHook(() => useStudyCards(undefined, cards, progressFor(cards), createConfig()));

    expect(result.current).toEqual([]);
  });

  it("re-evaluates scheduled Cards when their next review time arrives", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const deck = createDeck({ id: "scheduled" });
    const card = createCard({ id: "scheduled-card", deckId: deck.id, nextSeeingAt: new Date(1_500) });
    const cards = [card];
    const enabled = createConfig({ useCardInterval: true });
    const disabled = createConfig({ useCardInterval: false });
    const { result } = renderHook(() => ({
      enabled: useStudyCards(deck, cards, progressFor(cards), enabled),
      disabled: useStudyCards(deck, cards, progressFor(cards), disabled),
    }));

    expect(result.current.enabled).toEqual([]);
    expect(result.current.disabled).toEqual([card]);

    act(() => vi.advanceTimersByTime(499));
    expect(result.current.enabled).toEqual([]);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.enabled).toEqual([card]);
  });

  it("refreshes eligibility when only StudyProgress changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const deck = createDeck({ id: "scheduled" });
    const card = createCard({ id: "scheduled-card", deckId: deck.id, nextSeeingAt: new Date(1_200) });
    const config = createConfig({ useCardInterval: true });
    const initialProgress = {
      [card.id]: { ...createStudyProgressFromCard(card), nextSeeingAt: new Date(2_000) },
    };
    const { result, rerender } = renderHook(({ progress }) => useStudyCards(deck, [card], progress, config), {
      initialProps: { progress: initialProgress },
    });

    act(() => vi.advanceTimersByTime(0));
    expect(result.current).toEqual([]);

    vi.setSystemTime(1_500);
    rerender({
      progress: { [card.id]: { ...createStudyProgressFromCard(card), nextSeeingAt: new Date(1_200) } },
    });
    expect(result.current).toEqual([]);

    act(() => vi.advanceTimersByTime(0));
    expect(result.current).toEqual([card]);
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
    const config = createConfig({ useCardInterval: true });
    const { result } = renderHook(() => useStudyCards(deck, [card], progressFor([card]), config));

    expect(result.current).toEqual([]);

    act(() => vi.advanceTimersByTime(maxTimeout));
    expect(result.current).toEqual([]);

    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toEqual([card]);
  });
});
