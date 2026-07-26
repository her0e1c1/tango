/**
 * @file Verifies the study use-case boundary, including optimistic state, rollback, and terminal
 * session behavior.
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MutationLifecycle } from "@/hooks/mutationLifecycle";
import { useStudyActions } from "@/features/study/hooks/useStudyActions";
import { studyStore } from "@/features/study/state/studyStore";

const mocks = vi.hoisted(() => {
  const remoteUpdate = vi.fn();
  const cardUpdate = vi.fn(
    async (card: CardEdit, lifecycle?: MutationLifecycle<unknown>): Promise<void> => {
      let context: unknown;
      try {
        context = await lifecycle?.onMutate?.();
        await remoteUpdate(card);
        await lifecycle?.onSuccess?.(context);
      } catch (error) {
        await lifecycle?.onError?.(error, context);
        throw error;
      } finally {
        await lifecycle?.onSettled?.(context);
      }
    }
  );
  const pendingIds = new Set<CardId>();

  return {
    state: null as { card: Record<CardId, Card>; config: ConfigState } | null,
    filteredCards: [] as Card[],
    navigate: vi.fn(),
    cardUpdate,
    remoteUpdate,
    pendingIds,
    cardMutations: {
      update: cardUpdate,
      isPending: (id: CardId) => pendingIds.has(id),
      pending: false,
      error: null,
      retry: vi.fn(),
    },
  };
});

vi.mock("@/hooks/useConfig", () => ({
  useConfig: () => {
    if (mocks.state == null) throw new Error("Mock state is not initialized");
    return mocks.state.config;
  },
}));

vi.mock("@/hooks/useRemoteCollections", () => ({
  useRemoteCollections: () => ({
    cardsById: mocks.state?.card ?? {},
    filteredCardsByDeckId: () => mocks.filteredCards,
  }),
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/features/card/hooks/useCardMutations", () => ({
  useCardMutations: () => mocks.cardMutations,
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

const createConfig = (overrides: Partial<ConfigState> = {}): ConfigState =>
  ({
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
  }) as ConfigState;

const createState = (config = createConfig()) => ({
  card: { [card1.id]: card1, [card2.id]: card2 },
  config,
});

describe("useStudyActions", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(946684800000);
    mocks.remoteUpdate.mockResolvedValue(undefined);
    mocks.pendingIds.clear();
    mocks.state = createState();
    mocks.filteredCards = Object.values(mocks.state.card);
    studyStore.setState({
      sessionsByDeckId: {},
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("keeps the action API stable across an unchanged render", () => {
    const { result, rerender } = renderHook(() => useStudyActions(deck.id));
    const actions = result.current;

    rerender();

    expect(result.current).toBe(actions);
  });

  it("starts from filtered cards before navigating", () => {
    studyStore.setState({ showBackText: true, lastSwipe: "cardSwipeLeft" });
    mocks.navigate.mockImplementationOnce(() => {
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
        lastSwipe: undefined,
      });
    });
    const { result } = renderHook(() => useStudyActions(deck.id));

    act(() => result.current.start());

    expect(mocks.navigate).toHaveBeenCalledWith(`/deck/${deck.id}/study`, { replace: true });
  });

  it("rejects a route and session mismatch before writing a Card", async () => {
    studyStore.getState().startStudy("deck-2", [card1.id]);
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => result.current.swipeRight());

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(studyStore.getState().sessionsByDeckId["deck-2"]?.deckId).toBe("deck-2");
    expect(studyStore.getState().sessionsByDeckId[deck.id]).toBeUndefined();
    expect(studyStore.getState().lastSwipe).toBeUndefined();
  });

  it("writes an absolute Card patch and advances the optimistic session", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => result.current.swipeRight());

    const patch = {
      id: card1.id,
      deckId: deck.id,
      score: 1,
      numberOfSeen: 1,
      lastSeenAt: 946684800000,
    };
    expect(mocks.cardUpdate).toHaveBeenCalledWith(patch, expect.objectContaining({ onMutate: expect.any(Function) }));
    expect(mocks.remoteUpdate).toHaveBeenCalledExactlyOnceWith(patch);
    expect(studyStore.getState()).toMatchObject({
      sessionsByDeckId: {
        [deck.id]: {
          deckId: deck.id,
          cardOrderIds: [card1.id, card2.id],
          currentIndex: 1,
          lastStudiedAt: 946684800000,
        },
      },
      lastSwipe: "cardSwipeRight",
      showBackText: false,
    });
  });

  it("rolls the optimistic state back when the Card write fails", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    mocks.remoteUpdate.mockRejectedValueOnce(new Error("write failed"));
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => result.current.swipeRight());

    expect(studyStore.getState()).toMatchObject({
      sessionsByDeckId: { [deck.id]: { currentIndex: 0 } },
      showBackText: true,
      lastSwipe: undefined,
    });
  });

  it("does not roll back a newer same-index session update", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    let rejectWrite: ((error: Error) => void) | undefined;
    mocks.remoteUpdate.mockReturnValueOnce(
      new Promise<void>((_resolve, reject) => {
        rejectWrite = reject;
      })
    );
    const { result } = renderHook(() => useStudyActions(deck.id));

    const swipe = result.current.swipeRight();
    vi.mocked(Date.now).mockReturnValue(946684800100);
    act(() => studyStore.getState().touchStudy(deck.id));
    rejectWrite?.(new Error("write failed"));
    await act(async () => swipe);

    expect(studyStore.getState().sessionsByDeckId[deck.id]).toMatchObject({
      currentIndex: 1,
      lastStudiedAt: 946684800100,
    });
  });

  it("blocks another swipe while the target Card is pending", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    mocks.pendingIds.add(card1.id);
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => result.current.swipeRight());

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(studyStore.getState().sessionsByDeckId[deck.id]?.currentIndex).toBe(0);
  });

  it("blocks a second swipe while the first use case is unresolved", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    let finishWrite: () => void = () => undefined;
    mocks.remoteUpdate.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishWrite = resolve;
        })
    );
    const { result } = renderHook(() => useStudyActions(deck.id));

    const firstSwipe = result.current.swipeRight();
    await act(async () => result.current.swipeRight());

    expect(mocks.cardUpdate).toHaveBeenCalledOnce();
    expect(studyStore.getState().sessionsByDeckId[deck.id]?.currentIndex).toBe(1);

    await act(async () => {
      finishWrite();
      await firstSwipe;
    });
  });

  it("keeps back text visible when the config allows it", async () => {
    mocks.state = createState(createConfig({ hideBodyWhenCardChanged: false }));
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => result.current.swipeRight());

    expect(studyStore.getState().showBackText).toBe(true);
  });

  it("leaves study and Card state unchanged for DoNothing", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    const before = studyStore.getState();
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => result.current.swipeDown());

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(studyStore.getState()).toEqual(before);
  });

  it("removes only the route session for GoBack without a Card write", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.getState().startStudy("deck-2", ["other-card"]);
    studyStore.getState().setCurrentIndex(deck.id, 1);
    studyStore.setState({ showBackText: true });
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => result.current.swipeLeft());

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(studyStore.getState()).toMatchObject({
      sessionsByDeckId: { "deck-2": { deckId: "deck-2" } },
      lastSwipe: "cardSwipeLeft",
      showBackText: true,
    });
    expect(studyStore.getState().sessionsByDeckId[deck.id]).toBeUndefined();
  });

  it("updates the session index and hides back text", () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    const { result } = renderHook(() => useStudyActions(deck.id));

    act(() => result.current.updateIndex(1));

    expect(studyStore.getState().sessionsByDeckId[deck.id]?.currentIndex).toBe(1);
    expect(studyStore.getState().showBackText).toBe(false);
  });

  it("finishes only the route session after the final Card", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id]);
    studyStore.getState().startStudy("deck-2", ["other-card"]);
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => result.current.swipeRight());

    expect(mocks.cardUpdate).toHaveBeenCalledOnce();
    expect(studyStore.getState().sessionsByDeckId[deck.id]).toBeUndefined();
    expect(studyStore.getState().sessionsByDeckId["deck-2"]).toMatchObject({ deckId: "deck-2" });
  });
});
