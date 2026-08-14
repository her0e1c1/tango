import type { Card, CardId } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { ConfigState, SwipeDirection } from "@/shared/config";

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createConfig } from "@/test/factories";

const mocks = vi.hoisted(() => {
  const actions = {
    start: vi.fn(),
    swipeUp: vi.fn(),
    swipeDown: vi.fn(),
    swipeLeft: vi.fn(),
    swipeRight: vi.fn(),
    updateIndex: vi.fn(),
    toggleShowBackText: vi.fn(),
    toggleAutoPlay: vi.fn(),
    resetStudy: vi.fn(),
  };
  return {
    actions,
    config: null as ConfigState | null,
    hydrated: true,
    initializeStudySessionUi: vi.fn(),
    touchStudySession: vi.fn(),
    toggleShowHeader: vi.fn(),
    toggleShowSwipeButtonList: vi.fn(),
    state: {
      sessionsByDeckId: {} as Record<
        string,
        { deckId: string; cardOrderIds: CardId[]; currentIndex: number; lastStudiedAt: number }
      >,
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined as { direction: SwipeDirection; eventId: number } | undefined,
      clearLastSwipe: vi.fn(),
    },
  };
});

vi.mock("@/shared/config", () => ({
  useConfig: () => {
    if (mocks.config == null) throw new Error("Mock config is not initialized");
    return mocks.config;
  },
  toggleShowHeader: mocks.toggleShowHeader,
  toggleShowSwipeButtonList: mocks.toggleShowSwipeButtonList,
}));

vi.mock("../commands/studySessionCommands", () => ({
  initializeStudySessionUi: mocks.initializeStudySessionUi,
  touchStudySession: mocks.touchStudySession,
}));

vi.mock("./useEditStudyProgress", () => ({ useEditStudyProgress: () => ({ update: vi.fn() }) }));
vi.mock("./useStudyActions", () => ({ useStudyActions: () => mocks.actions }));
vi.mock("./useStudyControllerState", () => ({
  useStudyControllerState: (options: unknown) => options,
}));
vi.mock("./useStudyHydrated", () => ({ useStudyHydrated: () => mocks.hydrated }));
vi.mock("./useStudyStore", () => ({
  useStudyStore: (selector: (state: typeof mocks.state) => unknown) => selector(mocks.state),
}));

import { useStudyScreen } from "./useStudyScreen";

const deck: Deck = {
  id: "deck-id",
  uid: "user-id",
  name: "Deck",
  isPublic: false,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  category: "raw",
  convertToBr: false,
  selectedTags: [],
  tagAndFilter: false,
  scoreMax: null,
  scoreMin: null,
};

const card: Card = {
  id: "card-id",
  deckId: deck.id,
  uid: "user-id",
  frontText: "Front",
  backText: "Back",
  tags: ["typescript"],
  uniqueKey: "unique-key",
  score: 2,
  numberOfSeen: 3,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
};

const renderStudyScreen = (options?: { cardsById?: Record<CardId, Card>; readsReady?: boolean }) => {
  const onUnavailable = vi.fn();
  const cardsById = options?.cardsById ?? { [card.id]: card };
  const readsReady = options?.readsReady ?? true;
  return {
    ...renderHook(() => useStudyScreen({ cardsById, deck, readsReady, onUnavailable })),
    onUnavailable,
  };
};

describe("useStudyScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config = createConfig({
      cardInterval: 1,
      darkMode: true,
      showHeader: true,
      showSwipeButtonList: true,
      showSwipeFeedback: true,
    });
    mocks.hydrated = true;
    mocks.state.sessionsByDeckId = {
      [deck.id]: {
        deckId: deck.id,
        cardOrderIds: [card.id],
        currentIndex: 0,
        lastStudiedAt: 0,
      },
    };
    mocks.state.showBackText = false;
    mocks.state.autoPlay = false;
    mocks.state.lastSwipe = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds the active study view state and initializes its session", () => {
    const { result } = renderStudyScreen();

    expect(result.current).toMatchObject({
      card,
      category: "typescript",
      backText: { category: "typescript", code: true, dark: true },
      showBackText: false,
      showController: true,
      showHeader: true,
      showSwipeButtonList: true,
      swipeActions: {
        onClickUp: mocks.actions.swipeUp,
        onClickDown: mocks.actions.swipeDown,
        onClickLeft: mocks.actions.swipeLeft,
        onClickRight: mocks.actions.swipeRight,
      },
    });
    expect(result.current.controller).toMatchObject({
      index: 0,
      numberOfCards: 1,
      onChange: mocks.actions.updateIndex,
      onToggleAutoPlay: mocks.actions.toggleAutoPlay,
    });
    expect(mocks.initializeStudySessionUi).toHaveBeenCalledWith(false);
    expect(mocks.touchStudySession).toHaveBeenCalledWith(deck.id);
  });

  it("owns study shortcuts", () => {
    renderStudyScreen();

    for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "h", "b", " "]) {
      act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key })));
    }

    expect(mocks.actions.swipeUp).toHaveBeenCalledOnce();
    expect(mocks.actions.swipeDown).toHaveBeenCalledOnce();
    expect(mocks.actions.swipeLeft).toHaveBeenCalledOnce();
    expect(mocks.actions.swipeRight).toHaveBeenCalledOnce();
    expect(mocks.actions.toggleShowBackText).toHaveBeenCalledOnce();
    expect(mocks.toggleShowHeader).toHaveBeenCalledOnce();
    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledOnce();
    expect(mocks.actions.toggleAutoPlay).toHaveBeenCalledOnce();
  });

  it("clears swipe feedback after its display interval", () => {
    vi.useFakeTimers();
    mocks.state.lastSwipe = { direction: "cardSwipeLeft", eventId: 1 };
    const { result } = renderStudyScreen();

    expect(result.current.swipeFeedback).toBe("cardSwipeLeft");
    act(() => vi.advanceTimersByTime(899));
    expect(mocks.state.clearLastSwipe).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(mocks.state.clearLastSwipe).toHaveBeenCalledOnce();
  });

  it("waits for hydration and reads before rejecting an unavailable session", () => {
    mocks.state.sessionsByDeckId = {};
    mocks.hydrated = false;
    const onUnavailable = vi.fn();
    const view = renderHook(({ readsReady }) => useStudyScreen({ cardsById: {}, deck, readsReady, onUnavailable }), {
      initialProps: { readsReady: false },
    });

    expect(mocks.actions.resetStudy).not.toHaveBeenCalled();
    expect(onUnavailable).not.toHaveBeenCalled();

    mocks.hydrated = true;
    view.rerender({ readsReady: true });

    expect(mocks.actions.resetStudy).toHaveBeenCalledOnce();
    expect(onUnavailable).toHaveBeenCalledOnce();

    view.rerender({ readsReady: true });
    expect(mocks.actions.resetStudy).toHaveBeenCalledOnce();
    expect(onUnavailable).toHaveBeenCalledOnce();
  });
});
