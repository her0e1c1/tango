import type { Card } from "@/entities/card";
import type { Preferences } from "@/entities/preferences";
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
import { createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as Preferences | null,
  editStudyProgress: vi.fn(),
  touchStudySession: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-1" }));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => {
    if (mocks.preferences == null) throw new Error("Preferences not initialized");
    return mocks.preferences;
  },
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

import { useStudy } from "./useStudy";

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

describe("useStudy", () => {
  beforeEach(() => {
    clearStudySessions();
    localStorage.clear();
    vi.clearAllMocks();
    mocks.editStudyProgress.mockResolvedValue(undefined);
    mocks.preferences = createPreferences({
      cardInterval: 1,
      defaultAutoPlay: false,
      showHeader: true,
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
    const { result } = renderHook(() => useStudy(deckId, cards));
    expect(result.current).toMatchObject({
      status: "studying",
      session: { deckId, cardOrderIds: ["card-1", "card-2"], currentIndex: 0 },
      card: { id: "card-1" },
      showBackText: false,
    });
    expect(result.current).not.toHaveProperty("index");
    expect(result.current).not.toHaveProperty("numberOfCards");
    expect(mocks.touchStudySession).toHaveBeenCalledWith(deckId);

    act(() => result.current.toggleBackText());
    expect(result.current).toMatchObject({ status: "studying", showBackText: true });
    await actAsync(() => result.current.swipeRight());

    await waitFor(() => expect(result.current).toMatchObject({ status: "studying", card: { id: "card-2" } }));
    expect(result.current).toMatchObject({ showBackText: false, swipeFeedback: "cardSwipeRight" });
    expect(mocks.editStudyProgress).toHaveBeenCalledWith("user-1", expect.objectContaining({ cardId: "card-1" }));
  });

  it("reports preparing while the session card is not available", () => {
    const { result } = renderHook(() => useStudy(deckId, []));
    expect(result.current.status).toBe("preparing");
  });

  it("advances the session while autoplay is enabled", () => {
    vi.useFakeTimers();
    mocks.preferences = createPreferences({ cardInterval: 1, defaultAutoPlay: true });
    const { result } = renderHook(() => useStudy(deckId, cards));
    act(() => result.current.toggleBackText());

    act(() => vi.advanceTimersByTime(1000));

    expect(result.current).toMatchObject({ status: "studying", card: { id: "card-2" }, showBackText: false });
  });

  it("does not advance a restarted session with an old autoplay timer", () => {
    vi.useFakeTimers();
    mocks.preferences = createPreferences({ cardInterval: 1, defaultAutoPlay: true });
    renderHook(() => useStudy(deckId, cards));
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
    const { result } = renderHook(() => useStudy(deckId, cards));

    expect(result.current.status).toBe("invalid");
    await waitFor(() => expect(getStudySession(deckId)).toBeUndefined());
  });

  it("keeps the visible session unchanged when persistence fails", async () => {
    mocks.editStudyProgress.mockRejectedValueOnce(new Error("write failed"));
    const { result } = renderHook(() => useStudy(deckId, cards));

    await actAsync(() => result.current.swipeRight());

    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    expect(result.current).not.toHaveProperty("swipeFeedback");
  });

  it("blocks a second swipe while the first write is unresolved", async () => {
    let finishWrite: () => void = () => undefined;
    mocks.editStudyProgress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      })
    );
    const { result } = renderHook(() => useStudy(deckId, cards));

    const firstSwipe = result.current.swipeRight();
    await actAsync(() => result.current.swipeRight());
    expect(mocks.editStudyProgress).toHaveBeenCalledOnce();

    await actAsync(async () => {
      finishWrite();
      await firstSwipe;
    });
  });

  it("does not advance a session changed by the controller during the write", async () => {
    let finishWrite: () => void = () => undefined;
    mocks.editStudyProgress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      })
    );
    const { result } = renderHook(() => useStudy(deckId, cards));

    const swipe = result.current.swipeRight();
    setStudySessionIndex(deckId, 1);
    await actAsync(async () => {
      finishWrite();
      await swipe;
    });

    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(result.current).not.toHaveProperty("swipeFeedback");
  });

  it("advances after a timestamp-only session touch during the write", async () => {
    vi.spyOn(Date, "now").mockReturnValue(946_684_800_000);
    let finishWrite: () => void = () => undefined;
    mocks.editStudyProgress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      })
    );
    const { result } = renderHook(() => useStudy(deckId, cards));

    const swipe = result.current.swipeRight();
    vi.mocked(Date.now).mockReturnValue(946_684_800_100);
    touchStudySession(deckId);
    await actAsync(async () => {
      finishWrite();
      await swipe;
    });

    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(result.current).toMatchObject({ swipeFeedback: "cardSwipeRight" });
  });

  it("handles DoNothing and GoBack without writing progress", async () => {
    mocks.preferences = createPreferences({ cardSwipeDown: "DoNothing", cardSwipeLeft: "GoBack" });
    const { result } = renderHook(() => useStudy(deckId, cards));

    await actAsync(() => result.current.swipeDown());
    expect(getStudySession(deckId)).toBeDefined();
    await actAsync(() => result.current.swipeLeft());

    expect(mocks.editStudyProgress).not.toHaveBeenCalled();
    expect(getStudySession(deckId)).toBeUndefined();
  });

  it("removes the session after the final card is persisted", async () => {
    clearStudySessions();
    startStudy(deckId, cards.slice(0, 1), { shuffled: false, maxNumberOfCardsToLearn: 0 });
    const { result } = renderHook(() => useStudy(deckId, cards.slice(0, 1)));

    await actAsync(() => result.current.swipeRight());

    expect(mocks.editStudyProgress).toHaveBeenCalledOnce();
    expect(getStudySession(deckId)).toBeUndefined();
  });
});
