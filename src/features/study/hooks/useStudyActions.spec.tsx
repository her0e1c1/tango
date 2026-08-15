/**
 * @file Verifies the "useStudyActions" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "starts from filtered Query
 * cards before notifying its owner" and "rejects a route and session mismatch before writing a card".
 */

import type { Card, CardId } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api/firebase", () => ({ auth: {}, db: {} }));

import { useStudyActions } from "./useStudyActions";
import { studyStore } from "../state/studyStoreInstance";
import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => {
  const cardUpdate = vi.fn();

  return {
    state: null as { card: Record<CardId, Card>; preferences: Preferences } | null,
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
  card: { [card1.id]: card1, [card2.id]: card2 },
  preferences,
});

const getCardsById = () => mocks.state?.card ?? {};

describe("useStudyActions", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(946684800000);
    mocks.cardUpdate.mockResolvedValue(undefined);
    mocks.state = createState();
    studyStore.setState({
      sessionsByDeckId: {},
      showBackText: false,
      autoPlay: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts from filtered Query cards before notifying its owner", () => {
    studyStore.setState({ showBackText: true });
    const onStarted = vi.fn(() => {
      expect(studyStore.getState()).toMatchObject({
        sessionsByDeckId: {
          [deck.id]: {
            deckId: deck.id,
            cardOrderIds: [card1.id],
            currentIndex: 0,
            lastStudiedAt: 946684800000,
          },
        },
        showBackText: false,
        autoPlay: true,
      });
    });
    const { result } = renderHook(() => useStudyActions(deck.id, { cardsById: getCardsById(), onStarted }));

    act(() => {
      result.current.start([card1]);
    });

    expect(onStarted).toHaveBeenCalledOnce();
  });

  it("rejects a route and session mismatch before writing a card", async () => {
    studyStore.getState().startStudy("deck-2", [card1.id]);
    const { result } = renderHook(() =>
      useStudyActions(deck.id, { cardsById: getCardsById(), cardMutation: mocks.cardMutations })
    );

    await actAsync(async () => {
      await result.current.swipeRight();
    });

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(studyStore.getState().sessionsByDeckId["deck-2"]?.deckId).toBe("deck-2");
    expect(studyStore.getState().sessionsByDeckId[deck.id]).toBeUndefined();
  });

  it("writes a card patch, notifies onSwipe, and advances the Zustand session", async () => {
    const onSwipe = vi.fn();
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    const { result } = renderHook(() =>
      useStudyActions(deck.id, { cardsById: getCardsById(), cardMutation: mocks.cardMutations, onSwipe })
    );

    await actAsync(async () => {
      await result.current.swipeRight();
    });

    const patch = {
      cardId: card1.id,
      score: 1,
      numberOfSeen: 1,
      lastSeenAt: 946684800000,
    };
    expect(mocks.cardUpdate).toHaveBeenCalledWith(patch);
    expect(onSwipe).toHaveBeenCalledWith("cardSwipeRight");
    expect(studyStore.getState()).toMatchObject({
      sessionsByDeckId: {
        [deck.id]: {
          deckId: deck.id,
          cardOrderIds: [card1.id, card2.id],
          currentIndex: 1,
          lastStudiedAt: 946684800000,
        },
      },
      showBackText: false,
    });
  });

  it("rolls the optimistic study index back when the Card write fails", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    mocks.cardUpdate.mockRejectedValueOnce(new Error("write failed"));
    const { result } = renderHook(() =>
      useStudyActions(deck.id, { cardsById: getCardsById(), cardMutation: mocks.cardMutations })
    );

    await actAsync(async () => {
      await result.current.swipeRight();
    });

    expect(studyStore.getState()).toMatchObject({
      sessionsByDeckId: { [deck.id]: { currentIndex: 0 } },
      showBackText: true,
    });
  });

  it("does not roll back a newer same-index session update", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    let rejectWrite: ((error: Error) => void) | undefined;
    mocks.cardUpdate.mockReturnValueOnce(
      new Promise<void>((_resolve, reject) => {
        rejectWrite = reject;
      })
    );
    const { result } = renderHook(() =>
      useStudyActions(deck.id, { cardsById: getCardsById(), cardMutation: mocks.cardMutations })
    );

    const swipe = result.current.swipeRight();
    vi.mocked(Date.now).mockReturnValue(946684800100);
    act(() => studyStore.getState().touchStudy(deck.id));
    rejectWrite?.(new Error("write failed"));
    await actAsync(async () => swipe);

    expect(studyStore.getState().sessionsByDeckId[deck.id]).toMatchObject({
      currentIndex: 1,
      lastStudiedAt: 946684800100,
    });
  });

  it("blocks a second swipe while the first Card write is unresolved", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    let finishWrite: () => void = () => undefined;
    mocks.cardUpdate.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishWrite = resolve;
        })
    );
    const { result } = renderHook(() =>
      useStudyActions(deck.id, { cardsById: getCardsById(), cardMutation: mocks.cardMutations })
    );

    const firstSwipe = result.current.swipeRight();
    await actAsync(async () => {
      await result.current.swipeRight();
    });

    expect(mocks.cardUpdate).toHaveBeenCalledOnce();
    expect(studyStore.getState().sessionsByDeckId[deck.id]?.currentIndex).toBe(1);

    await actAsync(async () => {
      finishWrite();
      await firstSwipe;
    });
  });

  it("keeps back text visible when the long-lived preferences allows it", async () => {
    mocks.state = createState(createPreferences({ appearance: { hideBodyWhenCardChanged: false } }));
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    const { result } = renderHook(() =>
      useStudyActions(deck.id, { cardsById: getCardsById(), cardMutation: mocks.cardMutations })
    );

    await actAsync(async () => {
      await result.current.swipeRight();
    });

    expect(studyStore.getState().showBackText).toBe(true);
  });

  it("leaves all study and card state unchanged for DoNothing", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    const before = studyStore.getState();
    const { result } = renderHook(() =>
      useStudyActions(deck.id, { cardsById: getCardsById(), cardMutation: mocks.cardMutations })
    );

    await actAsync(async () => {
      await result.current.swipeDown();
    });

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(studyStore.getState()).toEqual(before);
  });

  it("removes only the route session for GoBack without a card write", async () => {
    const onSwipe = vi.fn();
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.getState().startStudy("deck-2", ["other-card"]);
    studyStore.getState().setCurrentIndex(deck.id, 1);
    studyStore.setState({ showBackText: true });
    const { result } = renderHook(() =>
      useStudyActions(deck.id, { cardsById: getCardsById(), cardMutation: mocks.cardMutations, onSwipe })
    );

    await actAsync(async () => {
      await result.current.swipeLeft();
    });

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(onSwipe).toHaveBeenCalledWith("cardSwipeLeft");
    expect(studyStore.getState()).toMatchObject({
      sessionsByDeckId: { "deck-2": { deckId: "deck-2" } },
      showBackText: true,
    });
    expect(studyStore.getState().sessionsByDeckId[deck.id]).toBeUndefined();
  });

  it("updates the session index and hides back text", () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    const { result } = renderHook(() =>
      useStudyActions(deck.id, { cardsById: getCardsById(), cardMutation: mocks.cardMutations })
    );

    act(() => {
      result.current.updateIndex(1);
    });

    expect(studyStore.getState().sessionsByDeckId[deck.id]?.currentIndex).toBe(1);
    expect(studyStore.getState().showBackText).toBe(false);
  });

  it("finishes only the route session after the final card", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id]);
    studyStore.getState().startStudy("deck-2", ["other-card"]);
    const { result } = renderHook(() =>
      useStudyActions(deck.id, { cardsById: getCardsById(), cardMutation: mocks.cardMutations })
    );

    await actAsync(async () => {
      await result.current.swipeRight();
    });

    expect(mocks.cardUpdate).toHaveBeenCalledOnce();
    expect(studyStore.getState().sessionsByDeckId[deck.id]).toBeUndefined();
    expect(studyStore.getState().sessionsByDeckId["deck-2"]).toMatchObject({ deckId: "deck-2" });
  });
});
