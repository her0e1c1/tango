import "@/test/mockFirestorePersistence";
vi.mock("@/entities/auth/@x/study-session", () => ({ getAuthUid: () => mocks.uid }));
import { restoreStudySession } from "@/test/utils/entityFixtures";
import { setStudySessionIndex } from "@/entities/study-session";
import * as studySessions from "@/entities/study-session";
import * as studyPersistence from "./actions/saveStudyOperation";
import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preference";
import { clearStudySessions, getStudySession, touchStudySession } from "@/entities/study-session";
import { startStudy } from "@/test/utils/entityFixtures";

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";
import { createDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  uid: "user-1",
  preferences: null as Preferences | null,
  cards: [] as Card[],
  deck: undefined as Deck | undefined,
  persistOperation: vi.fn(),
  onSwipeFeedback: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({ useAuth: () => ({ uid: mocks.uid }), getAuthUid: () => mocks.uid }));
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
  createdAt: 0,
  updatedAt: 0,
  fsrs: null,
  deletedAt: null,
}));

describe("Study Page model [STUDY-ACTIONS-04] [STUDY-ACTIONS-01] [STUDY-SESSION-03] [STUDY-SESSION-04] [STUDY-SESSION-05] [STUDY-SESSION-06] [STUDY-ACTIONS-05] [STUDY-CONTROLS-04]", () => {
  beforeEach(() => {
    mocks.uid = "user-1";
    clearStudySessions();
    localStorage.clear();
    vi.clearAllMocks();
    mocks.persistOperation.mockResolvedValue(undefined);
    mocks.cards = cards;
    mocks.deck = createDeck({ id: deckId, category: "raw" });
    mocks.preferences = createPreferences({
      cardInterval: 1,
      defaultAutoPlay: false,
      showSwipeFeedback: true,
      cardSwipeRight: "RateGood",
    });
    startStudy(deckId, cards, { shuffled: false, maxNumberOfCardsToLearn: 0 }, mocks.uid);
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
    expect(mocks.persistOperation).toHaveBeenCalledWith("user-1", expect.objectContaining({ cardId: "card-1" }));
  });

  it("preserves the session while the Card cache is empty", () => {
    mocks.cards = [];
    const session = getStudySession(deckId);
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    expect(result.current.query.status).toBe("preparing");
    expect(getStudySession(deckId)).toEqual(session);
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

  it("reports invalid when no active session exists", async () => {
    clearStudySessions();
    mocks.cards = [];

    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    expect(result.current.query.status).toBe("invalid");
    await waitFor(() => expect(getStudySession(deckId)).toBeUndefined());
  });

  it("advances the session while autoplay is enabled", async () => {
    vi.useFakeTimers();
    mocks.preferences = createPreferences({ cardInterval: 1, defaultAutoPlay: true });
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    act(() => result.current.toggleBackText());

    await actAsync(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

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
    act(() => startStudy(deckId, cards, { shuffled: false, maxNumberOfCardsToLearn: 0 }, mocks.uid));
    expect(getStudySession(deckId)?.sessionId).not.toBe(previousSessionId);
    expect(getStudySession(deckId)?.currentIndex).toBe(0);

    act(() => vi.advanceTimersByTime(500));

    expect(getStudySession(deckId)?.currentIndex).toBe(0);
  });

  it("preserves resumable progress when the current Card is absent from a partial cache", () => {
    mocks.cards = cards.slice(1);
    const session = getStudySession(deckId);
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    expect(result.current.query.status).toBe("invalid");
    expect(getStudySession(deckId)).toEqual(session);
  });

  it("keeps the current Card and releases the lock when saving fails", async () => {
    mocks.persistOperation.mockRejectedValueOnce(new Error("write failed"));
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    await actAsync(async () => result.current.swipeRight());
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    expect(result.current.pageState.swipePending).toBe(false);
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
  });

  it("does not complete the final Card when saving fails", async () => {
    await setStudySessionIndex(deckId, 1);
    mocks.persistOperation.mockRejectedValueOnce(new Error("write failed"));
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    await actAsync(async () => result.current.swipeRight());
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(result.current.pageState.completion).toBeUndefined();
  });

  it("waits for server acknowledgement before the next swipe", async () => {
    const request = Promise.withResolvers<void>();
    mocks.persistOperation.mockReturnValueOnce(request.promise);
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    await actAsync(async () => result.current.swipeRight());
    await actAsync(async () => result.current.swipeRight());
    expect(mocks.persistOperation).toHaveBeenCalledOnce();
    expect(result.current.pageState.swipePending).toBe(true);
    expect(result.current.pageState.completion).toBeUndefined();
    await actAsync(async () => {
      request.resolve();
      await request.promise;
    });
    expect(result.current.pageState.swipePending).toBe(false);
    await actAsync(async () => result.current.swipeRight());
    expect(result.current.pageState.completion).toEqual({ cardCount: 2 });
  });

  it("suppresses delayed swipe feedback after leaving the Page", async () => {
    const request = Promise.withResolvers<void>();
    mocks.persistOperation.mockReturnValueOnce(request.promise);
    const { result, unmount } = renderHook(() => useStudySessionPageModel(deckId));
    await actAsync(async () => result.current.swipeRight());
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
    unmount();
    await actAsync(async () => {
      request.resolve();
      await request.promise;
    });
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
  });

  it("serializes controller movement behind the pending answer", async () => {
    const request = Promise.withResolvers<void>();
    mocks.persistOperation.mockReturnValueOnce(request.promise);
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    act(() => {
      void result.current.swipeRight();
    });
    act(() => {
      void result.current.changeIndex(1);
    });
    await actAsync(async () => {
      request.resolve();
      await request.promise;
    });

    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(mocks.onSwipeFeedback).toHaveBeenCalledOnce();
  });

  it.each([true, false])(
    "renders the subscribed state while a final answer awaits acknowledgement (saved: %s)",
    async (saved) => {
      await setStudySessionIndex(deckId, 1);
      const previous = getStudySession(deckId);
      if (!previous) throw new Error("Expected final Card");
      const request = Promise.withResolvers<void>();
      mocks.persistOperation.mockReturnValueOnce(request.promise);
      const { result } = renderHook(() => useStudySessionPageModel(deckId));
      await actAsync(async () => result.current.swipeRight());
      act(() => clearStudySessions());
      expect(result.current.query.status).toBe("invalid");
      expect(result.current.pageState).toMatchObject({ swipePending: true, completion: undefined });
      await actAsync(async () => {
        if (saved) request.resolve();
        else {
          request.reject(new Error("permission-denied"));
        }
        await request.promise.catch(() => undefined);
      });
      expect(result.current.pageState.swipePending).toBe(false);
      expect(result.current.pageState.completion).toEqual(saved ? { cardCount: 2 } : undefined);
      expect(result.current.query.status).toBe("invalid");
      expect(mocks.navigate).not.toHaveBeenCalled();
      if (!saved) {
        act(() => restoreStudySession(previous));
        await actAsync(async () => result.current.swipeRight());
      }
      expect(result.current.pageState.completion).toEqual({ cardCount: 2 });
    }
  );

  it.each(["answer", "index", "abandon"] as const)(
    "unlocks a rejected %s without waiting for a rollback snapshot",
    async (operation) => {
      const previous = getStudySession(deckId);
      if (!previous) throw new Error("Expected active session");
      const request = Promise.withResolvers<void>();
      if (operation === "answer") mocks.persistOperation.mockReturnValueOnce(request.promise);
      if (operation === "index")
        vi.spyOn(studySessions, "setStudySessionIndex").mockImplementationOnce(async () => {
          await request.promise;
          return true;
        });
      if (operation === "abandon") {
        mocks.preferences = createPreferences({ cardSwipeRight: "GoBack" });
        vi.spyOn(studySessions, "abandonStudySession").mockReturnValueOnce(request.promise);
      }
      const { result } = renderHook(() => useStudySessionPageModel(deckId));
      await actAsync(async () => {
        if (operation === "index") result.current.changeIndex(1);
        else result.current.swipeRight();
        await Promise.resolve();
      });
      act(() => {
        if (operation === "abandon") clearStudySessions();
        else restoreStudySession({ ...previous, currentIndex: 1 });
      });
      await actAsync(async () => {
        request.reject(new Error("permission-denied"));
        await request.promise.catch(() => undefined);
      });
      expect(result.current.pageState.swipePending).toBe(false);
      expect(mocks.navigate).not.toHaveBeenCalled();
      expect(result.current.query.status).toBe(operation === "abandon" ? "invalid" : "studying");
      act(() => restoreStudySession(previous));
      expect(result.current.pageState.swipePending).toBe(false);
      expect(result.current.query).toMatchObject({ status: "studying", session: { currentIndex: 0 } });
      mocks.preferences = createPreferences({ cardSwipeRight: "RateGood" });
      await actAsync(async () => result.current.swipeRight());
      expect(result.current.query).toMatchObject({ session: { currentIndex: 1 } });
    }
  );

  it("completes an anonymous save without a snapshot and keeps later failures separate from a new save", async () => {
    let onLocalError: ((error: unknown) => void) | undefined;
    vi.spyOn(studyPersistence, "saveStudyOperation").mockImplementationOnce(async (_operation, session, onError) => {
      onLocalError = onError;
      await Promise.resolve();
      return { session: { ...session, currentIndex: 1 }, endReason: null };
    });
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    await actAsync(async () => result.current.swipeRight());
    expect(result.current.pageState.swipePending).toBe(false);
    act(() => onLocalError?.(new Error("local persistence failed")));
    expect(result.current.pageState.swipePending).toBe(false);
    expect(result.current.query).toMatchObject({ status: "studying", session: { currentIndex: 0 } });
    const retry = Promise.withResolvers<void>();
    mocks.persistOperation.mockReturnValueOnce(retry.promise);
    await actAsync(async () => result.current.swipeRight());
    act(() => onLocalError?.(new Error("old local failure")));
    expect(result.current.pageState.swipePending).toBe(true);
    await actAsync(async () => {
      retry.resolve();
      await retry.promise;
    });
    expect(result.current.query).toMatchObject({ session: { currentIndex: 1 } });
  });

  it("does not complete a final Card when the active session is replaced during the write", async () => {
    clearStudySessions();
    startStudy(deckId, cards.slice(0, 1), { shuffled: false, maxNumberOfCardsToLearn: 0 }, mocks.uid);
    mocks.cards = cards.slice(0, 1);
    const request = Promise.withResolvers<void>();
    mocks.persistOperation.mockReturnValueOnce(request.promise);
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    act(() => {
      void result.current.swipeRight();
    });
    act(() => startStudy(deckId, cards.slice(0, 1), { shuffled: false, maxNumberOfCardsToLearn: 0 }, mocks.uid));
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
    mocks.persistOperation.mockReturnValueOnce(request.promise);
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    act(() => {
      void result.current.swipeRight();
    });
    vi.mocked(Date.now).mockReturnValue(946_684_800_100);
    void touchStudySession(deckId);
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

    expect(mocks.persistOperation).not.toHaveBeenCalled();
    expect(getStudySession(deckId)).toBeUndefined();
    expect(mocks.onSwipeFeedback).toHaveBeenCalledExactlyOnceWith("cardSwipeLeft");
    expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("does not show swipe feedback when the preference is disabled", async () => {
    mocks.preferences = createPreferences({
      showSwipeFeedback: false,
      cardSwipeRight: "RateGood",
    });
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    await actAsync(async () => result.current.swipeRight());

    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
  });

  it.each([1, 0])("ignores backward slider movement at index %s without saving or hiding the answer", async (index) => {
    mocks.preferences = createPreferences({ cardSwipeLeft: "DoNothing", showSwipeFeedback: true });
    void setStudySessionIndex(deckId, index);
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    await actAsync(async () => result.current.toggleBackText());
    const session = getStudySession(deckId);

    await actAsync(async () => result.current.swipeLeft());
    await actAsync(async () => result.current.changeIndex(0));

    expect(result.current.query.status).toBe("studying");
    expect(getStudySession(deckId)).toEqual(session);
    expect(result.current.pageState.showBackText).toBe(true);
    expect(result.current.pageState.completion).toBeUndefined();
    expect(mocks.persistOperation).not.toHaveBeenCalled();
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
  });

  it("completes after the final Card is persisted and preserves the session Card count", async () => {
    void setStudySessionIndex(deckId, 1);
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    if (result.current.query.status !== "studying") throw new Error("Expected an active Study state");
    const { swipeRight } = result.current;
    await actAsync(async () => swipeRight());

    expect(mocks.persistOperation).toHaveBeenCalledOnce();
    expect(getStudySession(deckId)).toBeUndefined();
    expect(result.current.pageState.completion).toEqual({ cardCount: 2 });
  });

  it("shows a restored final Card instead of completion after a cloud rejection", async () => {
    void setStudySessionIndex(deckId, 1);
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    const previous = getStudySession(deckId);
    if (!previous) throw new Error("Expected the final Card");
    await actAsync(async () => result.current.swipeRight());
    expect(result.current.pageState.completion).toEqual({ cardCount: 2 });
    await actAsync(async () => restoreStudySession(previous));
    expect(result.current.query).toMatchObject({ status: "studying", card: { frontText: "card-2" } });
    expect(result.current.pageState.completion).toBeUndefined();
    await actAsync(async () => result.current.swipeRight());
    expect(result.current.pageState.completion).toEqual({ cardCount: 2 });
  });

  it("allows an explicit retry after Firestore rolls back a failed final Card save", async () => {
    void setStudySessionIndex(deckId, 1);
    const previous = getStudySession(deckId);
    if (!previous) throw new Error("Expected the final Card");
    mocks.persistOperation.mockRejectedValueOnce(new Error("write failed"));
    const { result } = renderHook(() => useStudySessionPageModel(deckId));

    await actAsync(async () => result.current.swipeRight());
    expect(result.current.pageState.completion).toBeUndefined();

    await actAsync(async () => restoreStudySession(previous));
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
    mocks.preferences = createPreferences({ cardSwipeRight: "RateGood" });
    mocks.cards = [];
    await actAsync(async () => swipe());
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    expect(mocks.persistOperation).not.toHaveBeenCalled();
    mocks.cards = cards;
    await actAsync(async () => swipe());
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
  });

  it("keeps the save lock across same-Deck reentry until acknowledgement", async () => {
    const request = Promise.withResolvers<void>();
    mocks.persistOperation.mockReturnValueOnce(request.promise);
    const { result: firstResult, unmount: unmountFirst } = renderHook(() => useStudySessionPageModel(deckId));
    await actAsync(async () => firstResult.current.swipeRight());
    unmountFirst();
    const { result: nextResult } = renderHook(() => useStudySessionPageModel(deckId));
    expect(nextResult.current.pageState.swipePending).toBe(true);
    await actAsync(async () => nextResult.current.swipeRight());
    expect(mocks.persistOperation).toHaveBeenCalledOnce();
    await actAsync(async () => {
      request.resolve();
      await request.promise;
    });
    expect(nextResult.current.pageState.swipePending).toBe(false);
    expect(nextResult.current.pageState.completion).toBeUndefined();
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
    await actAsync(async () => nextResult.current.swipeRight());
    expect(nextResult.current.pageState.completion).toEqual({ cardCount: 2 });
  });

  it.each(["same Deck", "other Deck", "other UID"])(
    "starts %s with fresh presentation on the first render",
    async (destination) => {
      void setStudySessionIndex(deckId, 1);
      const { result: firstResult, unmount: unmountFirst } = renderHook(() => useStudySessionPageModel(deckId));
      await actAsync(async () => firstResult.current.swipeRight());
      act(firstResult.current.openHelp);
      act(firstResult.current.toggleAutoPlay);
      expect(firstResult.current.pageState.completion).toEqual({ cardCount: 2 });
      const nextDeckId = destination === "other Deck" ? "deck-2" : deckId;
      if (destination === "other UID") mocks.uid = "user-2";
      act(() => startStudy(nextDeckId, cards, { shuffled: false, maxNumberOfCardsToLearn: 0 }, mocks.uid));
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
    void setStudySessionIndex(deckId, 1);
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

  it("ignores an old server acknowledgement after entering another Deck", async () => {
    void setStudySessionIndex(deckId, 1);
    const request = Promise.withResolvers<void>();
    mocks.persistOperation.mockReturnValueOnce(request.promise);
    const { result: firstResult, unmount: unmountFirst } = renderHook(() => useStudySessionPageModel(deckId));

    await actAsync(async () => firstResult.current.swipeRight());
    expect(mocks.onSwipeFeedback).not.toHaveBeenCalled();
    unmountFirst();

    startStudy("deck-2", cards, { shuffled: false, maxNumberOfCardsToLearn: 0 }, mocks.uid);
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

  it("pauses only the timer during Help and respects explicit playback stop", async () => {
    vi.useFakeTimers();
    mocks.preferences = createPreferences({ cardInterval: 1, defaultAutoPlay: true });
    const { result } = renderHook(() => useStudySessionPageModel(deckId));
    await actAsync(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    act(result.current.openHelp);
    await actAsync(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    expect(result.current.pageState.autoPlay).toBe(true);
    act(result.current.closeHelp);
    await actAsync(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    act(result.current.toggleAutoPlay);
    await actAsync(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    act(result.current.toggleAutoPlay);
    await actAsync(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
  });

  it("cancels the departed visit's timer before continuing the same Deck", async () => {
    vi.useFakeTimers();
    mocks.preferences = createPreferences({ cardInterval: 1, defaultAutoPlay: true });
    const { unmount: unmountFirst } = renderHook(() => useStudySessionPageModel(deckId));
    await actAsync(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    unmountFirst();
    renderHook(() => useStudySessionPageModel(deckId));
    await actAsync(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    await actAsync(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
  });
});

vi.mock("@/pages/study-session/model/actions/saveStudyOperation", async () => {
  const { applyStudySessionResult } = await import("@/test/utils/entityFixtures");
  return {
    saveStudyOperation: async (
      operation: import("./studyOperation").StudyOperation,
      session: import("@/entities/study-session").StudySession
    ) => {
      await Promise.resolve(
        mocks.persistOperation(operation.uid, {
          fsrs: operation.fsrs,
          cardId: operation.cardId,
          answeredAt: operation.answeredAt,
        })
      );
      const result = {
        session: { ...session, currentIndex: Math.min(session.currentIndex + 1, session.cardOrderIds.length - 1) },
        endReason: session.currentIndex + 1 === session.cardOrderIds.length ? ("completed" as const) : null,
      };
      applyStudySessionResult({ ...result.session, lastStudiedAt: operation.answeredAt }, result.endReason);
      return result;
    },
  };
});
