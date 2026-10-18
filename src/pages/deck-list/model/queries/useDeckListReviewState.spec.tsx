import "@/test/mockFirestorePersistence";
import { calculateFsrsState } from "@/entities/card";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { StudySession } from "@/entities/study-session";
import { createCard, createDeck, createPreferences } from "@/test/factories";
import { useDeckListState } from "./useDeckListState";

const input = vi.hoisted(() => ({
  cards: [] as Card[],
  decks: [] as Deck[],
  sessions: {} as Record<string, StudySession>,
  preferences: {} as ReturnType<typeof createPreferences>,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (original) => ({
  ...(await original<typeof import("@/entities/card")>()),
  useCards: () => input.cards,
}));
vi.mock("@/entities/deck", async (original) => ({
  ...(await original<typeof import("@/entities/deck")>()),
  useDecks: () => input.decks,
}));
vi.mock("@/entities/preference", () => ({ usePreferences: () => input.preferences }));
vi.mock("@/entities/study-session", async (original) => ({
  ...(await original<typeof import("@/entities/study-session")>()),
  useStudySessions: () => input.sessions,
}));

function card(deckId: string, dueAt?: number, overrides: Partial<Card> = {}) {
  const id = crypto.randomUUID();
  return createCard({
    id,
    fsrs: dueAt === undefined ? null : { ...calculateFsrsState(null, "good", 0), dueAt },
    deckId,
    ...overrides,
  });
}

describe("NAVIGATION-17 NAVIGATION-18 held review counts", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    input.preferences = createPreferences({ useCardInterval: true, maxNumberOfCardsToLearn: 1, shuffled: true });
    input.decks = ["new", "due-z", "due-a", "early", "future", "empty", "filtered", "active"].map((id) =>
      createDeck({
        id,
        name: id,
        ...(id === "filtered" ? { studyFilter: { selectedTags: ["selected"], tagAndFilter: false } } : {}),
      })
    );
    input.cards = [
      card("new"),
      card("due-z", 1000),
      card("due-a", 1000),
      card("early", 500),
      card("early"),
      card("future", 2000),
      card("filtered"),
      card("active", 3000),
      card("active"),
    ];
    input.sessions = {
      active: {
        sessionId: "session",
        deckId: "active",
        cardOrderIds: ["old-card"],
        currentIndex: 0,
        lastStudiedAt: 20,
        remote: { uid: "user-id", startedAt: 0 },
      },
    };
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("groups once, sorts due before new, counts active data rather than session length and keeps future and empty states", () => {
    // Given: Prepare `before` and any shared test state below.
    const before = structuredClone(input);
    // When: Exercise `renderHook` with the prepared inputs.
    const { result } = renderHook(useDeckListState);
    // Then: Verify the expected result in the assertions below.
    expect(result.current.totals).toEqual({ due: 3, new: 3 });
    expect(result.current.reviewNow.map(({ deck }) => deck.id)).toEqual(["early", "due-a", "due-z", "new"]);
    expect(result.current.studying[0]?.studySession).toEqual(input.sessions.active);
    expect(result.current.studying[0]?.review).toMatchObject({ due: 0, new: 1, nextDueAt: 3000 });
    expect(result.current.other.map(({ deck }) => deck.id)).toEqual(["empty", "filtered", "future"]);
    expect(result.current.other.map(({ cardCount, review }) => [cardCount, review?.nextDueAt])).toEqual([
      [0, undefined],
      [1, undefined],
      [1, 2000],
    ]);
    expect(input).toEqual(before);
  });

  it.each([false, true])("applies saved tag filters (AND=%s) without maximum or shuffle", (tagAndFilter) => {
    // Given: Use this case's inputs and any shared test setup.
    input.sessions = {};
    input.decks = [createDeck({ id: "filter", studyFilter: { selectedTags: ["a", "b"], tagAndFilter } })];
    input.cards = [
      card("filter", 1000, { tags: ["a", "b"] }),
      card("filter", undefined, { tags: ["a", "b"] }),
      card("filter", undefined, { tags: ["a"] }),
      card("filter", 1500, { tags: ["other"] }),
    ];
    // When: Exercise `renderHook` with the prepared inputs.
    const { result } = renderHook(useDeckListState);
    // Then: Verify the expected result in the assertions below.
    expect(result.current.totals).toEqual({ due: 1, new: tagAndFilter ? 1 : 2 });
    expect(result.current.nextDueAt).toBeUndefined();
  });

  it("refreshes all decks at deadlines with one timer and releases it on unmount", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderHook` with the prepared inputs.
    const { result, unmount } = renderHook(useDeckListState);
    // Then: Verify the expected result in the assertions below.
    expect(vi.getTimerCount()).toBe(1);
    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(1000));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.totals).toEqual({ due: 4, new: 3 });
    expect(result.current.reviewNow.map(({ deck }) => deck.id)).toContain("future");
    expect(vi.getTimerCount()).toBe(1);
    // When: Exercise `unmount` with the prepared inputs.
    unmount();
    // Then: Verify the expected result in the assertions below.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reevaluates on focus, visibility and changes to cards, filters, sessions and preference", () => {
    // Given: Use this case's inputs and any shared test setup.
    const { result, rerender } = renderHook(useDeckListState);
    vi.setSystemTime(2000);
    // When: Exercise `act` with the prepared inputs.
    act(() => window.dispatchEvent(new Event("focus")));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.totals?.due).toBe(4);
    vi.setSystemTime(3000);
    // When: Exercise `act` with the prepared inputs.
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.totals?.due).toBe(5);
    // When: Exercise `card` with the prepared inputs.
    input.cards = [...input.cards, card("new")];
    rerender();
    // Then: Verify the expected result in the assertions below.
    expect(result.current.totals?.new).toBe(4);
    input.decks = input.decks.map((deck) => ({
      ...deck,
      studyFilter: { selectedTags: ["missing"], tagAndFilter: false },
    }));
    // When: Exercise `rerender` with the prepared inputs.
    rerender();
    // Then: Verify the expected result in the assertions below.
    expect(result.current.totals).toEqual({ due: 0, new: 0 });
    expect(result.current.studying).toHaveLength(1);
    input.sessions = {};
    // When: Exercise `rerender` with the prepared inputs.
    rerender();
    // Then: Verify the expected result in the assertions below.
    expect(result.current.studying).toHaveLength(0);
    input.preferences = createPreferences({ useCardInterval: false });
    // When: Exercise `rerender` with the prepared inputs.
    rerender();
    // Then: Verify the expected result in the assertions below.
    expect(result.current.totals).toBeUndefined();
    expect(result.current.reviewNow).toEqual([]);
    expect(result.current.other).toHaveLength(8);
    expect(result.current.other.every((item) => item.review === undefined)).toBe(true);
  });
});
