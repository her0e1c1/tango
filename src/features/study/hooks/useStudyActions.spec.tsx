import type { Card } from "@/entities/card";
import type { Preferences } from "@/entities/preferences";
import {
  clearStudySessions,
  getStudySession,
  setStudySessionIndex,
  startStudy,
  touchStudySession,
} from "@/entities/study-session";

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";
import { createPreferences } from "@/test/factories";

import { useStudyActions } from "./useStudyActions";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

const mocks = vi.hoisted(() => ({ preferences: null as Preferences | null }));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => {
    if (mocks.preferences == null) throw new Error("Preferences not initialized");
    return mocks.preferences;
  },
}));

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

const startSession = (sessionCards: Card[] = cards): void => {
  startStudy(deckId, sessionCards, { shuffled: false, maxNumberOfCardsToLearn: 0 });
};

describe("useStudyActions", () => {
  const saveProgress = vi.fn();
  const onSwipe = vi.fn();
  const onCardChanged = vi.fn();

  beforeEach(async () => {
    await clearStudySessions();
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(946_684_800_000);
    saveProgress.mockResolvedValue(undefined);
    mocks.preferences = createPreferences({
      hideBodyWhenCardChanged: true,
      cardSwipeDown: "DoNothing",
      cardSwipeLeft: "GoBack",
      cardSwipeRight: "GoToNextCardMastered",
    });
  });

  afterEach(() => vi.restoreAllMocks());

  const renderActions = () =>
    renderHook(() => useStudyActions(deckId, { cards, saveProgress, onSwipe, onCardChanged }));

  it("persists the current card before advancing the session", async () => {
    startSession();
    let finishWrite: () => void = () => undefined;
    saveProgress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      })
    );
    const { result } = renderActions();

    const swipe = result.current.swipeRight();
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    expect(onSwipe).not.toHaveBeenCalled();

    await actAsync(async () => {
      finishWrite();
      await swipe;
    });

    expect(saveProgress).toHaveBeenCalledWith({
      cardId: "card-1",
      score: 1,
      numberOfSeen: 1,
      lastSeenAt: 946_684_800_000,
    });
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(onSwipe).toHaveBeenCalledWith("cardSwipeRight");
    expect(onCardChanged).toHaveBeenCalledOnce();
  });

  it("keeps the visible session unchanged when persistence fails", async () => {
    startSession();
    saveProgress.mockRejectedValueOnce(new Error("write failed"));
    const { result } = renderActions();

    await actAsync(() => result.current.swipeRight());

    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    expect(onSwipe).not.toHaveBeenCalled();
    expect(onCardChanged).not.toHaveBeenCalled();
  });

  it("blocks a second swipe while the first write is unresolved", async () => {
    startSession();
    let finishWrite: () => void = () => undefined;
    saveProgress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      })
    );
    const { result } = renderActions();

    const firstSwipe = result.current.swipeRight();
    await actAsync(() => result.current.swipeRight());
    expect(saveProgress).toHaveBeenCalledOnce();

    await actAsync(async () => {
      finishWrite();
      await firstSwipe;
    });
  });

  it("does not advance a session changed by the controller during the write", async () => {
    startSession();
    let finishWrite: () => void = () => undefined;
    saveProgress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      })
    );
    const { result } = renderActions();

    const swipe = result.current.swipeRight();
    setStudySessionIndex(deckId, 1);
    await actAsync(async () => {
      finishWrite();
      await swipe;
    });

    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("advances after a timestamp-only session touch during the write", async () => {
    startSession();
    let finishWrite: () => void = () => undefined;
    saveProgress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      })
    );
    const { result } = renderActions();

    const swipe = result.current.swipeRight();
    vi.mocked(Date.now).mockReturnValue(946_684_800_100);
    touchStudySession(deckId);
    await actAsync(async () => {
      finishWrite();
      await swipe;
    });

    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(onSwipe).toHaveBeenCalledWith("cardSwipeRight");
  });

  it("handles DoNothing and GoBack without writing progress", async () => {
    startSession();
    const { result } = renderActions();

    await actAsync(() => result.current.swipeDown());
    expect(getStudySession(deckId)).toBeDefined();
    await actAsync(() => result.current.swipeLeft());

    expect(saveProgress).not.toHaveBeenCalled();
    expect(onSwipe).toHaveBeenCalledWith("cardSwipeLeft");
    expect(getStudySession(deckId)).toBeUndefined();
  });

  it("removes the session after the final card is persisted", async () => {
    startSession(cards.slice(0, 1));
    const { result } = renderActions();

    await actAsync(() => result.current.swipeRight());

    expect(saveProgress).toHaveBeenCalledOnce();
    expect(getStudySession(deckId)).toBeUndefined();
  });
});
