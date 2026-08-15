import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createPreferences, createDeck } from "@/test/factories";
import { createStudyProgress } from "@/test/factories";
import type { StudyProgress } from "@/entities/study-progress";

const mocks = vi.hoisted(() => ({ progresses: [] as StudyProgress[] }));

vi.mock("@/entities/study-progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/study-progress")>();
  return { ...actual, useStudyProgresses: () => mocks.progresses };
});

import { useStudyCards } from "./useStudyCards";

describe("useStudyCards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.progresses = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("composes Deck, Card, config, and scheduling rules", () => {
    const now = Date.UTC(2026, 6, 19);
    vi.spyOn(Date, "now").mockReturnValue(now);
    const deck = createDeck({ id: "deck" });
    const available = createCard({ id: "available", deckId: deck.id });
    const future = createCard({ id: "future", deckId: deck.id });
    const availableProgress = createStudyProgress({ cardId: available.id, nextSeeingAt: new Date(now) });
    const futureProgress = createStudyProgress({ cardId: future.id, nextSeeingAt: new Date(now + 1) });
    mocks.progresses = [availableProgress, futureProgress];
    const cards = [available, future];

    const { result } = renderHook(() => useStudyCards(deck, cards, createPreferences({ useCardInterval: true })));

    expect(result.current).toEqual([{ card: available, progress: availableProgress }]);
  });

  it("returns no Cards when the Deck is unavailable", () => {
    const cards = [createCard({ deckId: "missing" })];

    const { result } = renderHook(() => useStudyCards(undefined, cards, createPreferences()));

    expect(result.current).toEqual([]);
  });

  it("re-evaluates scheduled Cards when their next review time arrives", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const deck = createDeck({ id: "scheduled" });
    const card = createCard({ id: "scheduled-card", deckId: deck.id });
    const progress = createStudyProgress({ cardId: card.id, nextSeeingAt: new Date(1_500) });
    mocks.progresses = [progress];
    const cards = [card];
    const enabled = createPreferences({ useCardInterval: true });
    const disabled = createPreferences({ useCardInterval: false });
    const { result } = renderHook(() => ({
      enabled: useStudyCards(deck, cards, enabled),
      disabled: useStudyCards(deck, cards, disabled),
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
    const { result } = renderHook(() => useStudyCards(deck, [card], config));

    expect(result.current).toEqual([]);

    act(() => vi.advanceTimersByTime(maxTimeout));
    expect(result.current).toEqual([]);

    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toEqual([{ card, progress }]);
  });
});
