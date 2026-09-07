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
  uid: "user-1",
  preferences: null as Preferences | null,
  cards: [] as Card[],
  deck: undefined as Deck | undefined,
  editStudyProgress: vi.fn(),
  onSwipeFeedback: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({ useAuth: () => ({ uid: mocks.uid }) }));
vi.mock("@/entities/preference", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/preference")>()),
  getPreferences: () => mocks.preferences,
  usePreferences: () => {
    if (mocks.preferences == null) throw new Error("Preferences not initialized");
    return mocks.preferences;
  },
}));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  useCards: () => mocks.cards,
  getCards: () => mocks.cards,
}));
vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  useDeck: () => mocks.deck,
}));
vi.mock("@/entities/study-progress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/study-progress")>()),
  editStudyProgress: mocks.editStudyProgress,
}));
vi.mock("../lib/showSwipeFeedback", () => ({ showSwipeFeedback: mocks.onSwipeFeedback }));
import { useStudySessionPageModel } from "./useStudySessionPageModel";

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

describe("Study Page model [SWIPE-02] [SWIPE-08] [SWIPE-09] [SWIPE-10] [SWIPE-11] [SWIPE-12] [SWIPE-24]", () => {
  beforeEach(() => {
    mocks.uid = "user-1";
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
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    expect(result.current.query).toMatchObject({
      status: "studying",
      session: { currentIndex: 0, cardCount: 2 },
      card: { frontText: "card-1" },
      showCardDetails: true,
      showPlaybackControls: true,
      playbackControlsAvailable: true,
    });

    act(() => result.current.toggleBackText());
    expect(result.current.pageState.showBackText).toBe(true);
    await actAsync(async () => result.current.swipeRight());

    await waitFor(() =>
      expect(result.current.query).toMatchObject({ status: "studying", card: { frontText: "card-2" } })
    );
    expect(result.current.pageState.showBackText).toBe(false);
    expect(mocks.onSwipeFeedback).toHaveBeenCalledExactlyOnceWith("cardSwipeRight");
    expect(mocks.editStudyProgress).toHaveBeenCalledWith("user-1", expect.objectContaining({ cardId: "card-1" }));
  });

  it("reports preparing while the session card is not available", () => {
    mocks.cards = [];
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    expect(result.current.query.status).toBe("preparing");
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

    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    expect(result.current.query).toMatchObject({
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

    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    expect(result.current.query.status).toBe("invalid");
    await waitFor(() => expect(getStudySession(deckId)).toBeUndefined());
  });

  it("advances the session while autoplay is enabled", () => {
    vi.useFakeTimers();
    mocks.preferences = createPreferences({ cardInterval: 1, defaultAutoPlay: true });
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    act(() => result.current.toggleBackText());

    act(() => vi.advanceTimersByTime(1000));

    expect(result.current.query).toMatchObject({
      status: "studying",
      card: { frontText: "card-2" },
    });
  });

  it("does not advance a restarted session with an old autoplay timer", () => {
    vi.useFakeTimers();
    mocks.preferences = createPreferences({ cardInterval: 1, defaultAutoPlay: true });
    renderHook(() => useStudySessionPageModel(deckId));
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
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    expect(result.current.query.status).toBe("invalid");
    await waitFor(() => expect(getStudySession(deckId)).toBeUndefined());
  });

  it("keeps the visible session unchanged when persistence fails", async () => {
    mocks.editStudyProgress.mockRejectedValueOnce(new Error("write failed"));
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    await actAsync(async () => result.current.swipeRight());

    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
  });

  it("does not complete the final Card when persistence fails", async () => {
    setStudySessionIndex(deckId, 1);
    mocks.editStudyProgress.mockRejectedValueOnce(new Error("write failed"));
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    await actAsync(async () => result.current.swipeRight());

    expect(result.current.query.status).toBe("studying");
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
  });

  it("blocks a second swipe while the first write is unresolved", async () => {
    const request = Promise.withResolvers<void>();
    mocks.editStudyProgress.mockReturnValueOnce(request.promise);
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    act(result.current.swipeRight);
    await actAsync(async () => result.current.swipeLeft());
    expect(mocks.editStudyProgress).toHaveBeenCalledOnce();

    await actAsync(async () => {
      request.resolve();
      await request.promise;
    });
  });

  it("does not publish route-owned swipe feedback after unmount", async () => {
    const request = Promise.withResolvers<void>();
    mocks.editStudyProgress.mockReturnValueOnce(request.promise);
    const { result, unmount } = renderHook(() => useStudySessionPageModel(deckId));

    act(result.current.swipeRight);
    unmount();
    await actAsync(async () => {
      request.resolve();
      await request.promise;
    });

    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
  });

  it("does not advance a session changed by the controller during the write", async () => {
    const request = Promise.withResolvers<void>();
    mocks.editStudyProgress.mockReturnValueOnce(request.promise);
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    act(result.current.swipeRight);
    setStudySessionIndex(deckId, 1);
    await actAsync(async () => {
      request.resolve();
      await request.promise;
    });

    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
  });

  it("does not complete a final Card when the active session is replaced during the write", async () => {
    clearStudySessions();
    startStudy(deckId, cards.slice(0, 1), { shuffled: false, maxNumberOfCardsToLearn: 0 });
    mocks.cards = cards.slice(0, 1);
    const request = Promise.withResolvers<void>();
    mocks.editStudyProgress.mockReturnValueOnce(request.promise);
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    act(result.current.swipeRight);
    act(() => startStudy(deckId, cards.slice(0, 1), { shuffled: false, maxNumberOfCardsToLearn: 0 }));
    await actAsync(async () => {
      request.resolve();
      await request.promise;
    });

    expect(result.current.query.status).toBe("studying");
    expect(getStudySession(deckId)).toBeDefined();
  });

  it("advances after a timestamp-only session touch during the write", async () => {
    vi.spyOn(Date, "now").mockReturnValue(946_684_800_000);
    const request = Promise.withResolvers<void>();
    mocks.editStudyProgress.mockReturnValueOnce(request.promise);
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    act(result.current.swipeRight);
    vi.mocked(Date.now).mockReturnValue(946_684_800_100);
    touchStudySession(deckId);
    await actAsync(async () => {
      request.resolve();
      await request.promise;
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
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    await actAsync(async () => result.current.swipeDown());
    expect(getStudySession(deckId)).toBeDefined();
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
    await actAsync(async () => result.current.swipeLeft());

    expect(mocks.editStudyProgress).not.toHaveBeenCalled();
    expect(getStudySession(deckId)).toBeUndefined();
    expect(mocks.onSwipeFeedback).toHaveBeenCalledExactlyOnceWith("cardSwipeLeft");
  });

  it("does not show swipe feedback when the preference is disabled", async () => {
    mocks.preferences = createPreferences({
      showSwipeFeedback: false,
      cardSwipeRight: "GoToNextCardMastered",
    });
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    await actAsync(async () => result.current.swipeRight());

    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
  });

  it("does not complete when previous crosses the first Card boundary", async () => {
    mocks.preferences = createPreferences({ cardSwipeLeft: "GoToPrevCard" });
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    await actAsync(async () => result.current.swipeLeft());

    expect(result.current.query.status).toBe("invalid");
    expect(getStudySession(deckId)).toBeUndefined();
  });

  it("completes after the final Card is persisted and preserves the session Card count", async () => {
    setStudySessionIndex(deckId, 1);
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    if (result.current.query.status !== "studying") throw new Error("Expected an active Study state");
    const { swipeRight } = result.current;
    await actAsync(async () => swipeRight());

    expect(mocks.editStudyProgress).toHaveBeenCalledOnce();
    expect(getStudySession(deckId)).toBeUndefined();
    expect(result.current.pageState.completion).toEqual({ cardCount: 2 });
  });

  it("allows an explicit retry after a failed final Card save", async () => {
    setStudySessionIndex(deckId, 1);
    mocks.editStudyProgress.mockRejectedValueOnce(new Error("write failed"));
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    await actAsync(async () => result.current.swipeRight());
    expect(result.current.pageState.completion).toBeUndefined();
    expect(result.current.pageState.swipePending).toBe(false);
    await actAsync(async () => result.current.swipeRight());
    expect(result.current.pageState.completion).toEqual({ cardCount: 2 });
  });

  it("reads the current Cards and action mapping when a previously bound callback is used", async () => {
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    const swipe = result.current.swipeRight;
    mocks.preferences = createPreferences({ cardSwipeRight: "DoNothing" });
    await actAsync(async () => swipe());
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    mocks.preferences = createPreferences({ cardSwipeRight: "GoToNextCardMastered" });
    mocks.cards = [];
    await actAsync(async () => swipe());
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    expect(mocks.editStudyProgress).not.toHaveBeenCalled();
    mocks.cards = cards;
    await actAsync(async () => swipe());
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
  });

  it("keeps the pending save locked across same-Deck reentry without hiding the new answer", async () => {
    const request = Promise.withResolvers<void>();
    mocks.editStudyProgress.mockReturnValueOnce(request.promise);
    const { result: firstResult, unmount: unmountFirst } = renderHook(() => useStudySessionPageModel(deckId));
    act(() => {
      firstResult.current.swipeRight();
    });
    unmountFirst();
    const { result: nextResult } = renderHook(() => useStudySessionPageModel(deckId));
    act(nextResult.current.toggleBackText);
    await actAsync(async () => nextResult.current.swipeUp());
    await actAsync(async () => nextResult.current.swipeDown());
    await actAsync(async () => nextResult.current.swipeLeft());
    expect(mocks.editStudyProgress).toHaveBeenCalledOnce();
    await actAsync(async () => {
      request.resolve();
      await request.promise;
    });
    expect(nextResult.current.query).toMatchObject({ session: { currentIndex: 1 } });
    expect(nextResult.current.pageState.showBackText).toBe(true);
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
    await actAsync(async () => nextResult.current.swipeRight());
    expect(nextResult.current.pageState.completion).toEqual({ cardCount: 2 });
  });

  it.each(["same Deck", "other Deck", "other UID"])(
    "starts %s with fresh presentation on the first render",
    async (destination) => {
      setStudySessionIndex(deckId, 1);
      const { result: firstResult, unmount: unmountFirst } = renderHook(() => useStudySessionPageModel(deckId));
      await actAsync(async () => firstResult.current.swipeRight());
      act(firstResult.current.openHelp);
      act(firstResult.current.toggleAutoPlay);
      expect(firstResult.current.pageState.completion).toEqual({ cardCount: 2 });
      const nextDeckId = destination === "other Deck" ? "deck-2" : deckId;
      if (destination === "other UID") mocks.uid = "user-2";
      act(() => startStudy(nextDeckId, cards, { shuffled: false, maxNumberOfCardsToLearn: 0 }));
      const presentations: unknown[] = [];
      const { result: nextResult } = renderHook(() => {
        const model = useStudySessionPageModel(nextDeckId);
        presentations.push(model.pageState);
        return model;
      });
      expect(presentations[0]).toEqual({
        completion: undefined,
        showBackText: false,
        helpOpen: false,
        autoPlay: false,
        swipePending: false,
      });
      act(nextResult.current.openHelp);
      // The previous visit's delayed cleanup cannot reset the newly entered Page.
      unmountFirst();
      expect(nextResult.current.pageState.helpOpen).toBe(true);
      expect(nextResult.current.pageState.completion).toBeUndefined();
    }
  );

  it("hides old completion before effects when the mounted Page changes UID", async () => {
    setStudySessionIndex(deckId, 1);
    const presentations: unknown[] = [];
    const { result, rerender } = renderHook(() => {
      const model = useStudySessionPageModel(deckId);
      presentations.push(model.pageState);
      return model;
    });
    await actAsync(async () => result.current.swipeRight());
    expect(result.current.pageState.completion).toEqual({ cardCount: 2 });
    mocks.uid = "user-2";
    mocks.preferences = createPreferences({ defaultAutoPlay: true });
    presentations.length = 0;
    rerender();
    expect(presentations[0]).toMatchObject({ completion: undefined, autoPlay: true, helpOpen: false });
    expect(result.current.pageState.completion).toBeUndefined();
  });

  it("does not publish an old final save into a newly entered Deck", async () => {
    setStudySessionIndex(deckId, 1);
    const request = Promise.withResolvers<void>();
    mocks.editStudyProgress.mockReturnValueOnce(request.promise);
    const { result: firstResult, unmount: unmountFirst } = renderHook(() => useStudySessionPageModel(deckId));
    act(() => {
      firstResult.current.swipeRight();
    });
    unmountFirst();
    startStudy("deck-2", cards, { shuffled: false, maxNumberOfCardsToLearn: 0 });
    const { result: nextResult } = renderHook(() => useStudySessionPageModel("deck-2"));
    act(nextResult.current.openHelp);
    await actAsync(async () => {
      request.resolve();
      await request.promise;
    });
    expect(getStudySession(deckId)).toBeUndefined();
    expect(nextResult.current.query).toMatchObject({ session: { currentIndex: 0 } });
    expect(nextResult.current.pageState).toMatchObject({ completion: undefined, helpOpen: true });
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
  });

  it("pauses only the timer during Help and respects explicit playback stop", () => {
    vi.useFakeTimers();
    mocks.preferences = createPreferences({ cardInterval: 1, defaultAutoPlay: true });
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    act(() => vi.advanceTimersByTime(500));
    act(result.current.openHelp);
    act(() => vi.advanceTimersByTime(2000));
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    expect(result.current.pageState.autoPlay).toBe(true);
    act(result.current.closeHelp);
    act(() => vi.advanceTimersByTime(500));
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    act(result.current.toggleAutoPlay);
    act(() => vi.advanceTimersByTime(1000));
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    act(result.current.toggleAutoPlay);
    act(() => vi.advanceTimersByTime(1000));
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
  });

  it("cancels the departed visit's timer before continuing the same Deck", () => {
    vi.useFakeTimers();
    mocks.preferences = createPreferences({ cardInterval: 1, defaultAutoPlay: true });
    const { unmount: unmountFirst } = renderHook(() => useStudySessionPageModel(deckId));
    act(() => vi.advanceTimersByTime(500));
    unmountFirst();
    renderHook(() => useStudySessionPageModel(deckId));
    act(() => vi.advanceTimersByTime(500));
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    act(() => vi.advanceTimersByTime(500));
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
  });
});
