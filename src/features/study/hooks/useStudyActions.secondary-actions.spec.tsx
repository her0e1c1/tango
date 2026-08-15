/**
 * @file Verifies secondary controls and terminal session transitions exposed by useStudyActions.
 */

import type { Card, CardId } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";
import { clearStudySessions, getStudySession, setStudySessionIndex, startStudySession } from "@/entities/study-session";

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { useStudyActions } from "./useStudyActions";
import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => {
  const cardUpdate = vi.fn();

  return {
    state: null as { cards: Card[]; preferences: Preferences } | null,
    cardUpdate,
    cardMutations: {
      update: cardUpdate,
    },
  };
});

vi.mock("@/entities/preferences", () => ({
  usePreferences: () => {
    if (mocks.state == null) throw new Error("Mock state is not initialized");
    return mocks.state.preferences;
  },
}));

const deck: Deck = {
  id: "deck-1",
  uid: "user-1",
  localMode: false,
  name: "Deck",
  isPublic: false,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  category: "",
  convertToBr: false,
  selectedTags: [],
  tagAndFilter: false,
  scoreMax: null,
  scoreMin: null,
};

/**
 * Provides the create card test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createCard = (id: CardId, numberOfSeen: number): Card => ({
  id,
  deckId: deck.id,
  uid: "user-1",
  frontText: id,
  backText: `${id}-back`,
  tags: [],
  uniqueKey: id,
  score: 0,
  numberOfSeen,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
});

const card1 = createCard("card-1", 0);
const card2 = createCard("card-2", 1);

import { createPreferences as factoryCreateConfig, type PreferencesOverrides } from "@/test/factories";

/**
 * Provides the create preferences test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createPreferences = (overrides: PreferencesOverrides = {}): Preferences =>
  factoryCreateConfig({
    shuffled: false,
    maxNumberOfCardsToLearn: 1,
    useCardInterval: false,
    defaultAutoPlay: true,
    hideBodyWhenCardChanged: true,
    cardSwipeUp: "GoToNextCardNotMastered",
    cardSwipeDown: "DoNothing",
    cardSwipeLeft: "GoBack",
    cardSwipeRight: "GoToNextCardMastered",
    ...overrides,
  });

/**
 * Provides the create state test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createState = (preferences = createPreferences()) => ({
  cards: [card1, card2],
  preferences,
});

const getCards = () => mocks.state?.cards ?? [];

describe("useStudyActions", () => {
  beforeEach(async () => {
    await clearStudySessions();
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(946_684_800_000);
    mocks.cardUpdate.mockResolvedValue(undefined);
    mocks.state = createState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps back text visible when the long-lived preferences allows it", async () => {
    const onHideBackText = vi.fn();
    mocks.state = createState(createPreferences({ appearance: { hideBodyWhenCardChanged: false } }));
    startStudySession(deck.id, [card1.id, card2.id]);
    const { result } = renderHook(() =>
      useStudyActions(deck.id, {
        cards: getCards(),
        cardMutation: mocks.cardMutations,
        showBackText: true,
        onHideBackText,
      })
    );

    await actAsync(async () => {
      await result.current.swipeRight();
    });

    expect(onHideBackText).not.toHaveBeenCalled();
  });

  it("leaves all study and card state unchanged for DoNothing", async () => {
    const onSwipe = vi.fn();
    startStudySession(deck.id, [card1.id, card2.id]);
    const before = getStudySession(deck.id);
    const { result } = renderHook(() =>
      useStudyActions(deck.id, { cards: getCards(), cardMutation: mocks.cardMutations, onSwipe })
    );

    await actAsync(async () => {
      await result.current.swipeDown();
    });

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(onSwipe).not.toHaveBeenCalled();
    expect(getStudySession(deck.id)).toEqual(before);
  });

  it("removes only the route session for GoBack without a card write", async () => {
    const rollbackSwipe = vi.fn();
    const onSwipe = vi.fn(() => rollbackSwipe);
    startStudySession(deck.id, [card1.id, card2.id]);
    startStudySession("deck-2", ["other-card"]);
    setStudySessionIndex(deck.id, 1);
    const { result } = renderHook(() =>
      useStudyActions(deck.id, { cards: getCards(), cardMutation: mocks.cardMutations, onSwipe })
    );

    await actAsync(async () => {
      await result.current.swipeLeft();
    });

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(onSwipe).toHaveBeenCalledWith("cardSwipeLeft");
    expect(rollbackSwipe).not.toHaveBeenCalled();
    expect(getStudySession("deck-2")).toMatchObject({ deckId: "deck-2" });
    expect(getStudySession(deck.id)).toBeUndefined();
  });

  it("updates the session index and notifies onHideBackText", () => {
    const onHideBackText = vi.fn();
    startStudySession(deck.id, [card1.id, card2.id]);
    const { result } = renderHook(() =>
      useStudyActions(deck.id, { cards: getCards(), cardMutation: mocks.cardMutations, onHideBackText })
    );

    act(() => {
      result.current.updateIndex(1);
    });

    expect(getStudySession(deck.id)?.currentIndex).toBe(1);
    expect(onHideBackText).toHaveBeenCalledOnce();
  });

  it("calls onToggleBackText when toggleShowBackText is invoked", () => {
    const onToggleBackText = vi.fn();
    const { result } = renderHook(() => useStudyActions(deck.id, { onToggleBackText }));

    act(() => {
      result.current.toggleShowBackText();
    });

    expect(onToggleBackText).toHaveBeenCalledOnce();
  });

  it("calls onToggleAutoPlay when toggleAutoPlay is invoked", () => {
    const onToggleAutoPlay = vi.fn();
    const { result } = renderHook(() => useStudyActions(deck.id, { onToggleAutoPlay }));

    act(() => {
      result.current.toggleAutoPlay();
    });

    expect(onToggleAutoPlay).toHaveBeenCalledOnce();
  });

  it("finishes only the route session after the final card", async () => {
    startStudySession(deck.id, [card1.id]);
    startStudySession("deck-2", ["other-card"]);
    const { result } = renderHook(() =>
      useStudyActions(deck.id, { cards: getCards(), cardMutation: mocks.cardMutations })
    );

    await actAsync(async () => {
      await result.current.swipeRight();
    });

    expect(mocks.cardUpdate).toHaveBeenCalledOnce();
    expect(getStudySession(deck.id)).toBeUndefined();
    expect(getStudySession("deck-2")).toMatchObject({ deckId: "deck-2" });
  });
});
