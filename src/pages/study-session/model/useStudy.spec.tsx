import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preference";
import {
  clearStudySessions,
  getStudySession,
  setStudySessionIndex,
  startStudy,
  touchStudySession,
} from "@/entities/study-session";

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";
import { createDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as Preferences | null,
  cards: [] as Card[],
  deck: undefined as Deck | undefined,
  editStudyProgress: vi.fn(),
  onSwipeFeedback: vi.fn(),
  touchStudySession: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-1" }));
vi.mock("@/entities/preference", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/preference")>()),
  usePreferences: () => {
    if (mocks.preferences == null) throw new Error("Preferences not initialized");
    return mocks.preferences;
  },
}));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  useCards: () => mocks.cards,
}));
vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  useDeck: () => mocks.deck,
}));
vi.mock("@/entities/study-progress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/study-progress")>()),
  editStudyProgress: mocks.editStudyProgress,
}));
vi.mock("@/entities/study-session", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/study-session")>();
  return {
    ...original,
    touchStudySession: (...args: Parameters<typeof touchStudySession>) => {
      mocks.touchStudySession(...args);
      return original.touchStudySession(...args);
    },
  };
});

import { useStudy as useStudyState } from "./useStudy";

const useAnyStudy = (routeDeckId: string) => {
  const study = useStudyState(routeDeckId, mocks.onSwipeFeedback);
  if (study == null) throw new Error("Expected the test Deck to exist");
  return study;
};

const useStudy = (routeDeckId: string) => {
  const study = useAnyStudy(routeDeckId);
  if (study.status === "completed") throw new Error("Expected an active Study state");
  return study;
};

const deckId = "deck-1";
const cards: Card[] = ["card-1", "card-2"].map((id) => ({
  id,
  deckId,
  uid: "user-1",
  frontText: id,
  backText: `${id}-back`,
  tags: [],
  uniqueKey: id,
  difficulty: 5,
  numberOfSeen: 0,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  lastSeenAt: 0,
}));

describe("useStudy [SWIPE-02] [SWIPE-10]", () => {
  beforeEach(() => {
    clearStudySessions();
    localStorage.clear();
    vi.clearAllMocks();
    mocks.editStudyProgress.mockResolvedValue(undefined);
    mocks.cards = cards;
    mocks.deck = createDeck({ id: deckId, category: "raw" });
    mocks.preferences = createPreferences({
      cardInterval: 1,
      defaultAutoPlay: false,
      showSwipeFeedback: true,
      cardSwipeRight: "GoToNextCardMastered",
    });
    startStudy(deckId, cards, { shuffled: false, maxNumberOfCardsToLearn: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("coordinates display state, persistence, and session progression", async () => {
    const { result } = renderHook(() => useStudy(deckId));
    expect(result.current).toMatchObject({
      status: "studying",
      session: { currentIndex: 0, cardCount: 2 },
      card: { frontText: "card-1" },
      showBackText: false,
      showCardDetails: true,
      showPlaybackControls: true,
      playbackControlsAvailable: true,
    });
    expect(result.current).not.toHaveProperty("index");
    expect(result.current).not.toHaveProperty("numberOfCards");
    expect(mocks.touchStudySession).toHaveBeenCalledWith(deckId);

    act(() => result.current.toggleBackText());
    expect(result.current).toMatchObject({ status: "studying", showBackText: true });
    await actAsync(() => result.current.swipeRight());

    await waitFor(() => expect(result.current).toMatchObject({ status: "studying", card: { frontText: "card-2" } }));
    expect(result.current).toMatchObject({ showBackText: false });
    expect(result.current).not.toHaveProperty("swipeFeedback");
    expect(mocks.onSwipeFeedback).toHaveBeenCalledExactlyOnceWith("cardSwipeRight");
    expect(mocks.editStudyProgress).toHaveBeenCalledWith("user-1", expect.objectContaining({ cardId: "card-1" }));
  });

  it("reports preparing while the session card is not available", () => {
    mocks.cards = [];
    const { result } = renderHook(() => useStudy(deckId));
    expect(result.current.status).toBe("preparing");
  });

  it("reports persisted control visibility and playback availability", () => {
    mocks.preferences = createPreferences({
      cardInterval: 0,
      controls: {
        showCardDetails: false,
        showSwipeButtonList: false,
        showPlaybackControls: false,
        showBackTextSwipeOverlays: true,
      },
    });

    const { result } = renderHook(() => useStudy(deckId));

    expect(result.current).toMatchObject({
      showSwipeButtonList: false,
      showPlaybackControls: false,
      showBackTextSwipeOverlays: true,
      showCardDetails: false,
      playbackControlsAvailable: false,
    });
  });

  it("reports invalid when the session has no current card", async () => {
    clearStudySessions();
    startStudy(deckId, [], { shuffled: false, maxNumberOfCardsToLearn: 0 });
    mocks.cards = [];

    const { result } = renderHook(() => useStudy(deckId));

    expect(result.current.status).toBe("invalid");
    await waitFor(() => expect(getStudySession(deckId)).toBeUndefined());
  });

  it("advances the session while autoplay is enabled", () => {
    vi.useFakeTimers();
    mocks.preferences = createPreferences({ cardInterval: 1, defaultAutoPlay: true });
    const { result } = renderHook(() => useStudy(deckId));
    act(() => result.current.toggleBackText());

    act(() => vi.advanceTimersByTime(1000));

    expect(result.current).toMatchObject({
      status: "studying",
      card: { frontText: "card-2" },
      showBackText: false,
    });
  });

  it("does not advance a restarted session with an old autoplay timer", () => {
    vi.useFakeTimers();
    mocks.preferences = createPreferences({ cardInterval: 1, defaultAutoPlay: true });
    renderHook(() => useStudy(deckId));
    const previousSessionId = getStudySession(deckId)?.sessionId;

    act(() => vi.advanceTimersByTime(500));
    act(() => startStudy(deckId, cards, { shuffled: false, maxNumberOfCardsToLearn: 0 }));
    expect(getStudySession(deckId)?.sessionId).not.toBe(previousSessionId);
    expect(getStudySession(deckId)?.currentIndex).toBe(0);

    act(() => vi.advanceTimersByTime(500));

    expect(getStudySession(deckId)?.currentIndex).toBe(0);
  });

  it("reports an invalid session and removes it", async () => {
    clearStudySessions();
    const { result } = renderHook(() => useStudy(deckId));

    expect(result.current.status).toBe("invalid");
    await waitFor(() => expect(getStudySession(deckId)).toBeUndefined());
  });

  it("keeps the visible session unchanged when persistence fails", async () => {
    mocks.editStudyProgress.mockRejectedValueOnce(new Error("write failed"));
    const { result } = renderHook(() => useStudy(deckId));

    await actAsync(() => result.current.swipeRight());

    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
  });

  it("does not complete the final Card when persistence fails", async () => {
    setStudySessionIndex(deckId, 1);
    mocks.editStudyProgress.mockRejectedValueOnce(new Error("write failed"));
    const { result } = renderHook(() => useStudy(deckId));

    await actAsync(() => result.current.swipeRight());

    expect(result.current.status).toBe("studying");
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
  });

  it("blocks a second swipe while the first write is unresolved", async () => {
    let finishWrite: () => void = () => undefined;
    mocks.editStudyProgress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      })
    );
    const { result } = renderHook(() => useStudy(deckId));

    const firstSwipe = result.current.swipeRight();
    await actAsync(() => result.current.swipeRight());
    expect(mocks.editStudyProgress).toHaveBeenCalledOnce();

    await actAsync(async () => {
      finishWrite();
      await firstSwipe;
    });
  });

  it("does not publish route-owned swipe feedback after unmount", async () => {
    const request = Promise.withResolvers<void>();
    mocks.editStudyProgress.mockReturnValueOnce(request.promise);
    const { result, unmount } = renderHook(() => useStudy(deckId));

    const swipe = result.current.swipeRight();
    unmount();
    await actAsync(async () => {
      request.resolve();
      await swipe;
    });

    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
  });

  it("does not advance a session changed by the controller during the write", async () => {
    let finishWrite: () => void = () => undefined;
    mocks.editStudyProgress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      })
    );
    const { result } = renderHook(() => useStudy(deckId));

    const swipe = result.current.swipeRight();
    setStudySessionIndex(deckId, 1);
    await actAsync(async () => {
      finishWrite();
      await swipe;
    });

    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
  });

  it("does not complete a final Card when the active session is replaced during the write", async () => {
    clearStudySessions();
    startStudy(deckId, cards.slice(0, 1), { shuffled: false, maxNumberOfCardsToLearn: 0 });
    mocks.cards = cards.slice(0, 1);
    let finishWrite: () => void = () => undefined;
    mocks.editStudyProgress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      })
    );
    const { result } = renderHook(() => useStudy(deckId));

    const swipe = result.current.swipeRight();
    act(() => startStudy(deckId, cards.slice(0, 1), { shuffled: false, maxNumberOfCardsToLearn: 0 }));
    await actAsync(async () => {
      finishWrite();
      await swipe;
    });

    expect(result.current.status).toBe("studying");
    expect(getStudySession(deckId)).toBeDefined();
  });

  it("advances after a timestamp-only session touch during the write", async () => {
    vi.spyOn(Date, "now").mockReturnValue(946_684_800_000);
    let finishWrite: () => void = () => undefined;
    mocks.editStudyProgress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      })
    );
    const { result } = renderHook(() => useStudy(deckId));

    const swipe = result.current.swipeRight();
    vi.mocked(Date.now).mockReturnValue(946_684_800_100);
    touchStudySession(deckId);
    await actAsync(async () => {
      finishWrite();
      await swipe;
    });

    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(mocks.onSwipeFeedback).toHaveBeenCalledExactlyOnceWith("cardSwipeRight");
  });

  it("handles DoNothing and GoBack without writing progress", async () => {
    mocks.preferences = createPreferences({
      showSwipeFeedback: true,
      cardSwipeDown: "DoNothing",
      cardSwipeLeft: "GoBack",
    });
    const { result } = renderHook(() => useStudy(deckId));

    await actAsync(() => result.current.swipeDown());
    expect(getStudySession(deckId)).toBeDefined();
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
    await actAsync(() => result.current.swipeLeft());

    expect(mocks.editStudyProgress).not.toHaveBeenCalled();
    expect(getStudySession(deckId)).toBeUndefined();
    expect(mocks.onSwipeFeedback).toHaveBeenCalledExactlyOnceWith("cardSwipeLeft");
  });

  it("does not show swipe feedback when the preference is disabled", async () => {
    mocks.preferences = createPreferences({
      showSwipeFeedback: false,
      cardSwipeRight: "GoToNextCardMastered",
    });
    const { result } = renderHook(() => useStudy(deckId));

    await actAsync(() => result.current.swipeRight());

    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
  });

  it("does not complete when previous crosses the first Card boundary", async () => {
    mocks.preferences = createPreferences({ cardSwipeLeft: "GoToPrevCard" });
    const { result } = renderHook(() => useStudy(deckId));

    await actAsync(() => result.current.swipeLeft());

    expect(result.current.status).toBe("invalid");
    expect(getStudySession(deckId)).toBeUndefined();
  });

  it("completes after the final Card is persisted and preserves the session Card count", async () => {
    setStudySessionIndex(deckId, 1);
    const { result } = renderHook(() => useAnyStudy(deckId));

    if (result.current.status !== "studying") throw new Error("Expected an active Study state");
    const { swipeRight } = result.current;
    await actAsync(swipeRight);

    expect(mocks.editStudyProgress).toHaveBeenCalledOnce();
    expect(getStudySession(deckId)).toBeUndefined();
    expect(result.current).toEqual({ status: "completed", completion: { cardCount: 2 } });
  });
});
