import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Card } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";
import { createCard, createConfig, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  cards: [] as Card[],
  deck: undefined as Deck | undefined,
}));

vi.mock("@/entities/card", () => ({
  useCardsByDeck: (deckId: DeckId) => ({
    cards: mocks.cards.filter((card) => card.deckId === deckId),
    status: "ready" as const,
    syncStatus: "synced" as const,
    error: undefined,
    retry: vi.fn(),
  }),
}));
vi.mock("@/entities/deck", () => ({
  useDeck: (deckId: DeckId) => ({ deck: mocks.deck?.id === deckId ? mocks.deck : undefined }),
}));

import { nextCardAvailabilityAt, useStudyCards } from "@/features/study/hooks/useStudyCards";

describe("useStudyCards", () => {
  beforeEach(() => {
    mocks.cards = [];
    mocks.deck = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("composes Deck, Card, config, and scheduling rules", () => {
    const now = Date.UTC(2026, 6, 19);
    vi.spyOn(Date, "now").mockReturnValue(now);
    const deck = createDeck({ id: "deck" });
    const available = createCard({ id: "available", deckId: deck.id, nextSeeingAt: new Date(now) });
    const future = createCard({ id: "future", deckId: deck.id, nextSeeingAt: new Date(now + 1) });
    mocks.deck = deck;
    mocks.cards = [available, future, createCard({ id: "other", deckId: "other" })];

    const { result } = renderHook(() => useStudyCards(deck.id, createConfig({ useCardInterval: true })));

    expect(result.current.cards).toEqual([available]);
  });

  it("returns no Cards when the Deck is unavailable", () => {
    mocks.cards = [createCard({ deckId: "missing" })];

    const { result } = renderHook(() => useStudyCards("missing", createConfig()));

    expect(result.current.cards).toEqual([]);
  });

  it("re-evaluates scheduled Cards when their next review time arrives", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const deck = createDeck({ id: "scheduled" });
    const card = createCard({ id: "scheduled-card", deckId: deck.id, nextSeeingAt: new Date(1_500) });
    mocks.deck = deck;
    mocks.cards = [card];
    const enabled = createConfig({ useCardInterval: true });
    const disabled = createConfig({ useCardInterval: false });
    const { result } = renderHook(() => ({
      enabled: useStudyCards(deck.id, enabled).cards,
      disabled: useStudyCards(deck.id, disabled).cards,
    }));

    expect(result.current.enabled).toEqual([]);
    expect(result.current.disabled).toEqual([card]);

    act(() => vi.advanceTimersByTime(499));
    expect(result.current.enabled).toEqual([]);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.enabled).toEqual([card]);
  });

  it("selects the nearest future review time", () => {
    const cards = [
      createCard({ id: "past", nextSeeingAt: new Date(900) }),
      createCard({ id: "later", nextSeeingAt: new Date(2_000) }),
      createCard({ id: "next", nextSeeingAt: new Date(1_500) }),
    ];

    expect(nextCardAvailabilityAt(cards, 1_000)).toBe(1_500);
  });
});
