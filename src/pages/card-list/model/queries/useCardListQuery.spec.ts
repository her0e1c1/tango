import { calculateFsrsState } from "@/entities/card";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Card } from "@/entities/card";
import type { Preferences } from "@/entities/preference";
import { createCard, createDeck, createPreferences } from "@/test/factories";

import { useCardListQuery } from "./useCardListQuery";

vi.mock("@/shared/firebase", () => ({
  auth: {},
  db: {},
}));

const repository = vi.hoisted(() => ({
  cards: [] as Card[],
  preferences: null as unknown as Preferences,
}));

vi.mock("@/entities/card", async (original) => ({
  ...(await original<typeof import("@/entities/card")>()),
  useCards: () => repository.cards,
  useCardsByDeckId: () => ({ cards: repository.cards, tags: [] }),
}));

vi.mock("@/entities/preference", () => ({
  usePreferences: () => repository.preferences,
}));

describe("useCardListQuery [CARD-FILTER-01 CARD-FILTER-03 CARD-FILTER-04]", () => {
  beforeEach(resetTestState);

  registerDerivesEmptyReasonAcrossNoCardsFilterZeroAndPopulatedStates();
  registerReportsNoCardsWhenTheDeckHasNoCards();
  registerReportsFilterZeroWhenCardsExistButDoNotMatchTheTagFilter();
  registerIncludesMatchingCardsScheduledForFutureReview();
});

function registerDerivesEmptyReasonAcrossNoCardsFilterZeroAndPopulatedStates() {
  it("derives emptyReason across no-cards, filter-zero, and populated states", () => {
    const deck = createDeck({ id: "deck-1" });
    const emptyFilter = {
      selectedTags: [],
      tagAndFilter: false,
    };

    repository.cards = [createCard({ id: "c-1", deckId: "deck-1" })];
    expect(readEmptyReason(deck, emptyFilter)).toBeUndefined();

    repository.cards = [];
    expect(readEmptyReason(deck, emptyFilter)).toBe("no-cards");

    repository.cards = [createCard({ id: "c-1", deckId: "deck-1" })];
    expect(readEmptyReason(deck, { ...emptyFilter, selectedTags: ["missing"] })).toBe("filter-zero");
    const fsrs = { ...calculateFsrsState(null, "good", 0), dueAt: Date.now() + 100_000 };

    repository.cards = [
      createCard({
        fsrs,
        id: "c-1",
        deckId: "deck-1",
      }),
    ];
    expect(readEmptyReason(deck, emptyFilter)).toBeUndefined();
  });
}

function registerReportsNoCardsWhenTheDeckHasNoCards() {
  it("reports no-cards when the deck has no cards", () => {
    repository.cards = [];
    const deck = createDeck({ id: "deck-1" });
    const filter = {
      selectedTags: [],
      tagAndFilter: false,
    };

    const { result } = renderHook(() =>
      useCardListQuery({
        deck,
        filter,
        shownCard: undefined,
        sortOrder: "standard",
      })
    );

    expect(result.current.rawCount).toBe(0);
    expect(result.current.visibleCount).toBe(0);
    expect(result.current.emptyReason).toBe("no-cards");
  });
}

function registerReportsFilterZeroWhenCardsExistButDoNotMatchTheTagFilter() {
  it("reports filter-zero when cards exist but do not match the tag filter", () => {
    repository.cards = [
      createCard({
        id: "c-1",
        deckId: "deck-1",
      }),
    ];
    const deck = createDeck({ id: "deck-1" });
    const filter = {
      selectedTags: ["missing"],
      tagAndFilter: false,
    };

    const { result } = renderHook(() =>
      useCardListQuery({
        deck,
        filter,
        shownCard: undefined,
        sortOrder: "standard",
      })
    );

    expect(result.current.rawCount).toBe(1);
    expect(result.current.visibleCount).toBe(0);
    expect(result.current.emptyReason).toBe("filter-zero");
  });
}

function registerIncludesMatchingCardsScheduledForFutureReview() {
  it("includes matching cards scheduled for future review", () => {
    const fsrs = { ...calculateFsrsState(null, "good", 0), dueAt: Date.now() + 100_000 };
    repository.cards = [
      createCard({
        fsrs,
        id: "c-1",
        deckId: "deck-1",
      }),
    ];
    const deck = createDeck({ id: "deck-1" });
    const filter = {
      selectedTags: [],
      tagAndFilter: false,
    };

    const { result } = renderHook(() =>
      useCardListQuery({
        deck,
        filter,
        shownCard: undefined,
        sortOrder: "standard",
      })
    );

    expect(result.current.rawCount).toBe(1);
    expect(result.current.visibleCount).toBe(1);
    expect(result.current.emptyReason).toBeUndefined();
  });
}

function resetTestState() {
  repository.preferences = createPreferences({
    study: { useCardInterval: true, cardInterval: 1 },
  });
}

function readEmptyReason(
  deck: ReturnType<typeof createDeck>,
  filter: { selectedTags: string[]; tagAndFilter: boolean }
) {
  return renderHook(() => useCardListQuery({ deck, filter, shownCard: undefined, sortOrder: "standard" })).result
    .current.emptyReason;
}
