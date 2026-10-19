import { getCardFilter, getStudyFilter } from "@/entities/deck";
import { seedCardFsrs } from "@/test/studyStateFixtures";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { replaceAuthSession } from "@/entities/auth";
import { cardStore } from "@/entities/card/model/store";
import { deckStore } from "@/entities/deck/model/store";
import { updatePreferences } from "@/entities/preference";
import { createCard, createDeck, createPreferences } from "@/test/factories";
import { useStudySessionStartState } from "@/pages/study-session-start/model/queries/useStudySessionStartState";
import { useCardListQuery } from "@/pages/card-list/model/queries/useCardListQuery";
import { useDeckViewQuery } from "@/pages/deck-view/model/queries/useDeckViewQuery";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
const now = Date.parse("2026-09-21T00:00:00Z");
const deck = createDeck({ id: "deck", uid: "uid", studyFilter: { selectedTags: [], tagAndFilter: false } });
function setDeadline(dueAt: number) {
  cardStore.setState({
    cardsById: { card: createCard({ id: "card", deckId: deck.id, uid: "uid" }) },
  });
  seedCardFsrs("card", dueAt);
}

describe("mounted deadline consumers [STUDY-SESSION-18 CARD-FILTER-01]", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    vi.useFakeTimers();
    vi.setSystemTime(now);
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: false, displayName: null });
    deckStore.setState({ remoteDecks: [deck] });
    updatePreferences(createPreferences({ study: { useCardInterval: true } }));
    setDeadline(now + 1000);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(["start", "list", "view"] as const)(
    "applies deadlines only to study while browsing stays complete (%s)",
    (page) => {
      // Given: Use this case's inputs and any shared test setup.
      // When: Exercise `renderHook` with the prepared inputs.
      const { result, unmount } = renderHook(() => {
        const start = useStudySessionStartState(deck.id, getStudyFilter(deck));
        const list = useCardListQuery({
          deck,
          filter: getCardFilter(deck),
          shownCard: undefined,
          sortOrder: "standard",
        });
        const view = useDeckViewQuery(deck, getCardFilter(deck), "card", false);
        return page === "start" ? start.cardsLength : page === "list" ? list.cards.length : view.total;
      });
      // Then: Verify the expected result in the assertions below.
      expect(result.current).toBe(page === "start" ? 0 : 1);
      // When: Exercise `act` with the prepared inputs.
      act(() => vi.advanceTimersByTime(999));
      // Then: Verify the expected result in the assertions below.
      expect(result.current).toBe(page === "start" ? 0 : 1);
      // When: Exercise `act` with the prepared inputs.
      act(() => vi.advanceTimersByTime(1));
      // Then: Verify the expected result in the assertions below.
      expect(result.current).toBe(1);
      // When: Exercise `unmount` with the prepared inputs.
      unmount();
      // Then: Verify the expected result in the assertions below.
      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it("waits safely for a deadline beyond the browser timeout limit", () => {
    // Given: Use this case's inputs and any shared test setup.
    setDeadline(now + 2 ** 32);
    const { result, unmount } = renderHook(() => useStudySessionStartState(deck.id, getStudyFilter(deck)));
    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(2 ** 31 - 1));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(2 ** 31 - 1));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(0);
    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(2));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
    unmount();
  });

  it("handles clock movement, late callbacks, replacement and cleanup", () => {
    // Given: Use this case's inputs and any shared test setup.
    setDeadline(now + 120_000);
    const { result, unmount } = renderHook(() => useStudySessionStartState(deck.id, getStudyFilter(deck)));
    expect(result.current.cardsLength).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
    // When: Advance halfway toward the current deadline.
    act(() => vi.advanceTimersByTime(60_000));
    // Then: Keep the Card unavailable and retain one pending deadline timer.
    expect(result.current.cardsLength).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
    // When: Replace the current deadline with a nearer one.
    act(() => setDeadline(Date.now() + 1000));
    // Then: Replace the existing timer instead of adding another.
    expect(vi.getTimerCount()).toBe(1);
    // When: Exercise `act` with the prepared inputs.
    act(() => {
      vi.setSystemTime(now);
      window.dispatchEvent(new Event("focus"));
    });
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(0);
    // When: Exercise `act` with the prepared inputs.
    act(() => {
      vi.setSystemTime(now + 100_000);
      vi.advanceTimersToNextTimer();
    });
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
    // When: Exercise `act` with the prepared inputs.
    act(() => setDeadline(Date.now() + 1000));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(0);
    // When: Exercise `unmount` with the prepared inputs.
    unmount();
    // Then: Verify the expected result in the assertions below.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("refreshes after foreground return and removes the timer when interval filtering is off", () => {
    // Given: Use this case's inputs and any shared test setup.
    const { result, unmount } = renderHook(() => useStudySessionStartState(deck.id, getStudyFilter(deck)));
    // When: Exercise `act` with the prepared inputs.
    act(() => {
      vi.setSystemTime(now + 1000);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(1);
    // When: Exercise `act` with the prepared inputs.
    act(() => setDeadline(now + 10_000));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(0);
    // When: Exercise `act` with the prepared inputs.
    act(() => updatePreferences(createPreferences({ study: { useCardInterval: false } })));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(1);
    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(1));
    // Then: Verify the expected result in the assertions below.
    expect(vi.getTimerCount()).toBe(0);
    unmount();
  });
  it("samples current time on settings and data changes without waiting for a timer", () => {
    // Given: Use this case's inputs and any shared test setup.
    updatePreferences(createPreferences({ study: { useCardInterval: false } }));
    // When: Exercise `renderHook` with the prepared inputs.
    const { result, unmount } = renderHook(() => useStudySessionStartState(deck.id, getStudyFilter(deck)));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(1);
    // When: Exercise `act` with the prepared inputs.
    act(() => {
      vi.setSystemTime(now + 2000);
      updatePreferences(createPreferences({ study: { useCardInterval: true } }));
    });
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(1);
    // When: Exercise `act` with the prepared inputs.
    act(() => {
      vi.setSystemTime(now);
      setDeadline(now + 500);
    });
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(0);
    // When: Exercise `act` with the prepared inputs.
    act(() => {
      vi.setSystemTime(now + 1000);
      setDeadline(now + 600);
    });
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(1);
    unmount();
  });
  it("accepts equivalent input arrays recreated by the consumer", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderHook` with the prepared inputs.
    const { result, rerender, unmount } = renderHook(() =>
      useStudySessionStartState(deck.id, {
        ...getStudyFilter(deck),
        selectedTags: [...getStudyFilter(deck).selectedTags],
      })
    );
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(0);
    // When: Exercise `rerender` with the prepared inputs.
    rerender();
    act(() => vi.advanceTimersByTime(1000));
    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(1);
    unmount();
  });
});
