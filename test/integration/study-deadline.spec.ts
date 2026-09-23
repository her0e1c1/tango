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
const deck = createDeck({ id: "deck", uid: "uid", selectedTags: [] });
function setDeadline(dueAt: number) {
  cardStore.setState({
    remoteCards: [createCard({ id: "card", deckId: deck.id, uid: "uid" })],
  });
  seedCardFsrs("card", dueAt);
}

describe("mounted deadline consumers [STUDY-SESSION-01 CARD-FILTER-01]", () => {
  beforeEach(() => {
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
      const { result, unmount } = renderHook(() => {
        const start = useStudySessionStartState(deck.id, deck);
        const list = useCardListQuery({ deck, filter: deck, shownCard: undefined, sortOrder: "standard" });
        const view = useDeckViewQuery(deck, deck, "card", false);
        return page === "start" ? start.cardsLength : page === "list" ? list.cards.length : view.total;
      });
      expect(result.current).toBe(page === "start" ? 0 : 1);
      act(() => vi.advanceTimersByTime(999));
      expect(result.current).toBe(page === "start" ? 0 : 1);
      act(() => vi.advanceTimersByTime(1));
      expect(result.current).toBe(1);
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it("waits safely for a deadline beyond the browser timeout limit", () => {
    setDeadline(now + 2 ** 32);
    const { result, unmount } = renderHook(() => useStudySessionStartState(deck.id, deck));
    act(() => vi.advanceTimersByTime(2 ** 31 - 1));
    expect(result.current.cardsLength).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(2 ** 31 - 1));
    expect(result.current.cardsLength).toBe(0);
    act(() => vi.advanceTimersByTime(2));
    expect(result.current.cardsLength).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
    unmount();
  });

  it("handles clock movement, late callbacks, replacement and cleanup", () => {
    setDeadline(now + 120_000);
    const { result, unmount } = renderHook(() => useStudySessionStartState(deck.id, deck));
    expect(result.current.cardsLength).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current.cardsLength).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
    act(() => setDeadline(Date.now() + 1000));
    expect(vi.getTimerCount()).toBe(1);
    act(() => {
      vi.setSystemTime(now);
      window.dispatchEvent(new Event("focus"));
    });
    expect(result.current.cardsLength).toBe(0);
    act(() => {
      vi.setSystemTime(now + 100_000);
      vi.advanceTimersToNextTimer();
    });
    expect(result.current.cardsLength).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
    act(() => setDeadline(Date.now() + 1000));
    expect(result.current.cardsLength).toBe(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("refreshes after foreground return and removes the timer when interval filtering is off", () => {
    const { result, unmount } = renderHook(() => useStudySessionStartState(deck.id, deck));
    act(() => {
      vi.setSystemTime(now + 1000);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.cardsLength).toBe(1);
    act(() => setDeadline(now + 10_000));
    expect(result.current.cardsLength).toBe(0);
    act(() => updatePreferences(createPreferences({ study: { useCardInterval: false } })));
    expect(result.current.cardsLength).toBe(1);
    act(() => vi.advanceTimersByTime(1));
    expect(vi.getTimerCount()).toBe(0);
    unmount();
  });
  it("samples current time on settings and data changes without waiting for a timer", () => {
    updatePreferences(createPreferences({ study: { useCardInterval: false } }));
    const { result, unmount } = renderHook(() => useStudySessionStartState(deck.id, deck));
    expect(result.current.cardsLength).toBe(1);
    act(() => {
      vi.setSystemTime(now + 2000);
      updatePreferences(createPreferences({ study: { useCardInterval: true } }));
    });
    expect(result.current.cardsLength).toBe(1);
    act(() => {
      vi.setSystemTime(now);
      setDeadline(now + 500);
    });
    expect(result.current.cardsLength).toBe(0);
    act(() => {
      vi.setSystemTime(now + 1000);
      setDeadline(now + 600);
    });
    expect(result.current.cardsLength).toBe(1);
    unmount();
  });
  it("accepts equivalent input arrays recreated by the consumer", () => {
    const { result, rerender, unmount } = renderHook(() =>
      useStudySessionStartState(deck.id, { ...deck, selectedTags: [...deck.selectedTags] })
    );
    expect(result.current.cardsLength).toBe(0);
    rerender();
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.cardsLength).toBe(1);
    unmount();
  });
});
