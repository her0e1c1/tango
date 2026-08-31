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
import { createDeck, createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as Preferences | null,
  cards: [] as Card[],
  deck: undefined as Deck | undefined,
  editStudyProgress: vi.fn(),
  fetchRemoteCardRead: vi.fn(),
  localCardsHydrated: true,
  showToast: vi.fn(),
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
  fetchRemoteCardRead: mocks.fetchRemoteCardRead,
  useCards: () => mocks.cards,
  useLocalCardsHydrated: () => mocks.localCardsHydrated,
}));
vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  useDeck: () => mocks.deck,
}));
vi.mock("@/entities/study-progress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/study-progress")>()),
  editStudyProgress: mocks.editStudyProgress,
}));
vi.mock("@/shared/ui/toast", () => ({ showToast: mocks.showToast }));
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
  const study = useStudyState(routeDeckId);
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
  score: 0,
  numberOfSeen: 0,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  lastSeenAt: 0,
}));

const activeRemoteRead = (card: Extract<Card, { uid: string }>) => {
  const { score, numberOfSeen, lastSeenAt, nextSeeingAt, interval, ...cardRead } = card;
  return {
    status: "active" as const,
    read: {
      card: cardRead,
      progress: {
        cardId: card.id,
        score,
        numberOfSeen,
        ...(lastSeenAt !== undefined ? { lastSeenAt } : {}),
        ...(nextSeeingAt !== undefined ? { nextSeeingAt } : {}),
        ...(interval !== undefined ? { interval } : {}),
      },
    },
  };
};

const remoteCardAt = (index: number): Extract<Card, { uid: string }> => {
  const card = cards[index];
  if (card == null || !("uid" in card)) throw new Error("Expected a remote Card fixture");
  return card;
};

describe("SWIPE-01 SWIPE-08 SWIPE-27 SWIPE-28 SWIPE-29 useStudy", () => {
  beforeEach(() => {
    clearStudySessions();
    localStorage.clear();
    vi.clearAllMocks();
    mocks.editStudyProgress.mockResolvedValue(undefined);
    mocks.fetchRemoteCardRead.mockReset();
    mocks.localCardsHydrated = true;
    mocks.cards = cards;
    mocks.deck = createDeck({ id: deckId, uid: "user-1", category: "raw" });
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
    expect(mocks.showToast).toHaveBeenCalledExactlyOnceWith({
      message: "Swiped right",
      tone: "neutral",
      durationMs: 900,
      dismissible: false,
    });
    expect(mocks.editStudyProgress).toHaveBeenCalledWith("user-1", expect.objectContaining({ cardId: "card-1" }), {
      persistence: "remote",
      cardId: "card-1",
    });
  });

  it("reports unavailable only after the server confirms a missing remote target", async () => {
    mocks.cards = [];
    mocks.fetchRemoteCardRead.mockResolvedValue({ status: "missing" });
    const { result } = renderHook(() => useStudy(deckId));

    expect(result.current.status).toBe("verifying");
    await waitFor(() => expect(result.current).toMatchObject({ status: "unavailable", reason: "remote-missing" }));
    expect(getStudySession(deckId)).toBeDefined();
  });

  it("distinguishes a tombstoned remote target from a missing document", async () => {
    mocks.cards = [];
    mocks.fetchRemoteCardRead.mockResolvedValue({ status: "tombstoned" });
    const { result } = renderHook(() => useStudy(deckId));

    await waitFor(() => expect(result.current).toMatchObject({ status: "unavailable", reason: "remote-tombstoned" }));
    expect(getStudySession(deckId)).toBeDefined();
  });

  it("waits for local hydration before treating a missing Card as authoritative", () => {
    mocks.cards = [];
    mocks.deck = createLocalDeck({ id: deckId, category: "raw" });
    mocks.localCardsHydrated = false;
    const { result, rerender } = renderHook(() => useStudy(deckId));

    expect(result.current.status).toBe("verifying");
    mocks.localCardsHydrated = true;
    rerender();

    expect(result.current).toMatchObject({ status: "unavailable", reason: "local-missing" });
    expect(mocks.fetchRemoteCardRead).not.toHaveBeenCalled();
    expect(getStudySession(deckId)).toBeDefined();

    act(() => {
      if (result.current.status !== "unavailable") throw new Error("Expected unavailable Study state");
      result.current.recover();
    });
    expect(getStudySession(deckId)).toBeUndefined();
  });

  it("removes a confirmed unavailable session only through explicit identity-checked recovery", async () => {
    mocks.cards = [];
    mocks.fetchRemoteCardRead.mockResolvedValue({ status: "missing" });
    const { result } = renderHook(() => useStudy(deckId));
    await waitFor(() => expect(result.current.status).toBe("unavailable"));
    if (result.current.status !== "unavailable") throw new Error("Expected unavailable Study state");

    let recovered = false;
    act(() => {
      recovered = result.current.status === "unavailable" && result.current.recover();
    });

    expect(recovered).toBe(true);
    expect(getStudySession(deckId)).toBeUndefined();
  });

  it("does not remove a replacement session through stale recovery", async () => {
    mocks.cards = [];
    mocks.fetchRemoteCardRead.mockResolvedValue({ status: "missing" });
    const { result } = renderHook(() => useStudy(deckId));
    await waitFor(() => expect(result.current.status).toBe("unavailable"));
    if (result.current.status !== "unavailable") throw new Error("Expected unavailable Study state");
    const { recover } = result.current;
    const previousSessionId = getStudySession(deckId)?.sessionId;

    act(() => startStudy(deckId, cards, { shuffled: false, maxNumberOfCardsToLearn: 0 }));
    const replacementSessionId = getStudySession(deckId)?.sessionId;
    expect(replacementSessionId).not.toBe(previousSessionId);

    let recovered = true;
    act(() => {
      recovered = recover();
    });
    expect(recovered).toBe(false);
    expect(getStudySession(deckId)?.sessionId).toBe(replacementSessionId);
  });

  it("deduplicates Retry while pending and restores the verified Card without replacing the session", async () => {
    const retryRead = Promise.withResolvers<ReturnType<typeof activeRemoteRead>>();
    mocks.cards = [];
    mocks.fetchRemoteCardRead
      .mockRejectedValueOnce(new Error("network failure"))
      .mockReturnValueOnce(retryRead.promise);
    const { result } = renderHook(() => useStudy(deckId));

    await waitFor(() => expect(result.current).toMatchObject({ status: "verification-error", retrying: false }));
    const sessionId = getStudySession(deckId)?.sessionId;
    act(() => {
      if (result.current.status !== "verification-error") throw new Error("Expected verification error state");
      result.current.retry();
      result.current.retry();
    });

    expect(result.current).toMatchObject({ status: "verification-error", retrying: true });
    expect(mocks.fetchRemoteCardRead).toHaveBeenCalledTimes(2);
    await actAsync(async () => {
      retryRead.resolve(activeRemoteRead(remoteCardAt(0)));
      await retryRead.promise;
    });

    await waitFor(() =>
      expect(result.current).toMatchObject({ status: "studying", focusCard: true, card: { frontText: "card-1" } })
    );
    expect(getStudySession(deckId)?.sessionId).toBe(sessionId);
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
  });

  it("keeps the session recoverable when Retry also fails", async () => {
    mocks.cards = [];
    mocks.fetchRemoteCardRead.mockRejectedValue(new Error("network failure"));
    const { result } = renderHook(() => useStudy(deckId));
    await waitFor(() => expect(result.current).toMatchObject({ status: "verification-error", retrying: false }));

    act(() => {
      if (result.current.status !== "verification-error") throw new Error("Expected verification error state");
      result.current.retry();
    });

    await waitFor(() => {
      expect(mocks.fetchRemoteCardRead).toHaveBeenCalledTimes(2);
      expect(result.current).toMatchObject({ status: "verification-error", retrying: false });
    });
    expect(getStudySession(deckId)).toBeDefined();
  });

  it.each([
    ["missing", "remote-missing"],
    ["tombstoned", "remote-tombstoned"],
  ] as const)("maps a Retry-confirmed %s target to %s recovery", async (status, reason) => {
    mocks.cards = [];
    mocks.fetchRemoteCardRead.mockRejectedValueOnce(new Error("network failure")).mockResolvedValueOnce({ status });
    const { result } = renderHook(() => useStudy(deckId));
    await waitFor(() => expect(result.current).toMatchObject({ status: "verification-error", retrying: false }));

    act(() => {
      if (result.current.status !== "verification-error") throw new Error("Expected verification error state");
      result.current.retry();
    });

    await waitFor(() => expect(result.current).toMatchObject({ status: "unavailable", reason }));
    expect(getStudySession(deckId)).toBeDefined();
  });

  it("ignores a verification result after the session target is replaced", async () => {
    const oldRead = Promise.withResolvers<{ status: "missing" }>();
    const replacementRead = Promise.withResolvers<{ status: "missing" }>();
    mocks.cards = [];
    mocks.fetchRemoteCardRead.mockImplementation((_uid: string, cardId: string) =>
      cardId === "card-1" ? oldRead.promise : replacementRead.promise
    );
    const { result } = renderHook(() => useStudy(deckId));
    await waitFor(() => expect(mocks.fetchRemoteCardRead).toHaveBeenCalledWith("user-1", "card-1"));
    const previousSessionId = getStudySession(deckId)?.sessionId;

    act(() => startStudy(deckId, [remoteCardAt(1)], { shuffled: false, maxNumberOfCardsToLearn: 0 }));
    await waitFor(() => expect(mocks.fetchRemoteCardRead).toHaveBeenCalledWith("user-1", "card-2"));
    await actAsync(async () => {
      oldRead.resolve({ status: "missing" });
      await oldRead.promise;
    });

    expect(result.current.status).toBe("verifying");
    expect(getStudySession(deckId)?.sessionId).not.toBe(previousSessionId);
    expect(getStudySession(deckId)?.cardOrderIds).toEqual(["card-2"]);

    await actAsync(async () => {
      replacementRead.resolve({ status: "missing" });
      await replacementRead.promise;
    });
  });

  it("ignores a stale Retry result when a restarted session reuses the same Card ID", async () => {
    const staleRetry = Promise.withResolvers<ReturnType<typeof activeRemoteRead>>();
    const restartedVerification = Promise.withResolvers<{ status: "missing" }>();
    mocks.cards = [];
    mocks.fetchRemoteCardRead
      .mockRejectedValueOnce(new Error("network failure"))
      .mockReturnValueOnce(staleRetry.promise)
      .mockReturnValueOnce(restartedVerification.promise);
    const { result } = renderHook(() => useStudy(deckId));
    await waitFor(() => expect(result.current).toMatchObject({ status: "verification-error", retrying: false }));
    const previousSessionId = getStudySession(deckId)?.sessionId;

    act(() => {
      if (result.current.status !== "verification-error") throw new Error("Expected verification error state");
      result.current.retry();
    });
    expect(result.current).toMatchObject({ status: "verification-error", retrying: true });

    act(() => startStudy(deckId, cards, { shuffled: false, maxNumberOfCardsToLearn: 0 }));
    await waitFor(() => expect(mocks.fetchRemoteCardRead).toHaveBeenCalledTimes(3));
    const restartedSessionId = getStudySession(deckId)?.sessionId;
    expect(restartedSessionId).not.toBe(previousSessionId);
    expect(getStudySession(deckId)?.cardOrderIds[0]).toBe("card-1");

    await actAsync(async () => {
      staleRetry.resolve(activeRemoteRead(remoteCardAt(0)));
      await staleRetry.promise;
    });
    expect(result.current.status).toBe("verifying");
    expect(getStudySession(deckId)?.sessionId).toBe(restartedSessionId);

    await actAsync(async () => {
      restartedVerification.resolve({ status: "missing" });
      await restartedVerification.promise;
    });
    await waitFor(() => expect(result.current).toMatchObject({ status: "unavailable", reason: "remote-missing" }));
  });

  it("writes the displayed local Card while a same-ID remote copy overlaps migration", async () => {
    const localCards = [
      createLocalCard({ id: "card-1", deckId, frontText: "local card" }),
      createLocalCard({ id: "card-2", deckId, frontText: "next local card" }),
    ];
    mocks.deck = createLocalDeck({ id: deckId, category: "raw" });
    mocks.cards = [remoteCardAt(0), ...localCards];
    clearStudySessions();
    startStudy(deckId, localCards, { shuffled: false, maxNumberOfCardsToLearn: 0 });
    const { result } = renderHook(() => useStudy(deckId));

    expect(result.current).toMatchObject({ status: "studying", card: { frontText: "local card" } });
    await actAsync(() => result.current.swipeRight());

    expect(mocks.editStudyProgress).toHaveBeenCalledWith("user-1", expect.objectContaining({ cardId: "card-1" }), {
      persistence: "local",
      cardId: "card-1",
    });
  });

  it("writes the verified remote Card while a same-ID local copy overlaps subscription catch-up", async () => {
    const currentCard = remoteCardAt(0);
    mocks.cards = [createLocalCard({ id: currentCard.id, deckId }), remoteCardAt(1)];
    mocks.fetchRemoteCardRead.mockResolvedValue(activeRemoteRead(currentCard));
    const { result } = renderHook(() => useStudy(deckId));
    await waitFor(() => expect(result.current).toMatchObject({ status: "studying", card: { frontText: "card-1" } }));

    await actAsync(() => result.current.swipeRight());

    expect(mocks.editStudyProgress).toHaveBeenCalledWith("user-1", expect.objectContaining({ cardId: "card-1" }), {
      persistence: "remote",
      cardId: "card-1",
    });
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
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
    expect(mocks.showToast).not.toHaveBeenCalled();
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
    expect(mocks.showToast).not.toHaveBeenCalled();
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
    expect(mocks.showToast).not.toHaveBeenCalled();
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
    expect(mocks.showToast).toHaveBeenCalledExactlyOnceWith({
      message: "Swiped right",
      tone: "neutral",
      durationMs: 900,
      dismissible: false,
    });
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
    expect(mocks.showToast).not.toHaveBeenCalled();
    await actAsync(() => result.current.swipeLeft());

    expect(mocks.editStudyProgress).not.toHaveBeenCalled();
    expect(getStudySession(deckId)).toBeUndefined();
    expect(mocks.showToast).toHaveBeenCalledExactlyOnceWith({
      message: "Swiped left",
      tone: "neutral",
      durationMs: 900,
      dismissible: false,
    });
  });

  it("does not show swipe feedback when the preference is disabled", async () => {
    mocks.preferences = createPreferences({
      showSwipeFeedback: false,
      cardSwipeRight: "GoToNextCardMastered",
    });
    const { result } = renderHook(() => useStudy(deckId));

    await actAsync(() => result.current.swipeRight());

    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(mocks.showToast).not.toHaveBeenCalled();
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
