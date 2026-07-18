import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useStudyActions } from "@/features/study/hooks/useStudyActions";
import { studyStore } from "@/features/study/state/studyStore";

const mocks = vi.hoisted(() => ({
  state: null as { card: Record<CardId, Card>; config: ConfigState } | null,
  navigate: vi.fn(),
  cardUpdate: vi.fn(),
  pendingIds: new Set<CardId>(),
}));

vi.mock("@/hooks/useConfig", () => ({
  useConfig: () => {
    if (mocks.state == null) throw new Error("Mock state is not initialized");
    return mocks.state.config;
  },
}));

vi.mock("@/query/useRemoteCollections", () => ({
  useRemoteCollections: () => {
    const cardsById = mocks.state?.card ?? {};
    return {
      cardsById,
      filteredCardsByDeckId: (deckId: string) =>
        Object.values(cardsById).filter((card): card is Card => card?.deckId === deckId),
    };
  },
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/features/card/hooks/useCardMutations", () => ({
  useCardMutations: () => ({
    update: mocks.cardUpdate,
    isPending: (id: CardId) => mocks.pendingIds.has(id),
    pending: false,
    error: null,
    retry: vi.fn(),
  }),
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
    mocks.cardUpdate.mockResolvedValue(undefined);
    mocks.pendingIds.clear();
    mocks.state = createState();
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

  it("starts from filtered Query cards before navigating", () => {
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

    act(() => {
      result.current.start();
    });

    expect(mocks.navigate).toHaveBeenCalledWith(`/deck/${deck.id}/study`, { replace: true });
  });

  it("rejects a route and session mismatch before writing a card", async () => {
    studyStore.getState().startStudy("deck-2", [card1.id]);
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => {
      await result.current.swipeRight();
    });

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(studyStore.getState().sessionsByDeckId["deck-2"]?.deckId).toBe("deck-2");
    expect(studyStore.getState().sessionsByDeckId[deck.id]).toBeUndefined();
    expect(studyStore.getState().lastSwipe).toBeUndefined();
  });

  it("writes a card patch and advances the Zustand session", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => {
      await result.current.swipeRight();
    });

    const patch = {
      id: card1.id,
      deckId: deck.id,
      score: 1,
      numberOfSeen: 1,
      lastSeenAt: 946684800000,
    };
    expect(mocks.cardUpdate).toHaveBeenCalledWith(patch);
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

  it("rolls the optimistic study index back when the Card write fails", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    mocks.cardUpdate.mockRejectedValueOnce(new Error("write failed"));
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => {
      await result.current.swipeRight();
    });

    expect(studyStore.getState()).toMatchObject({
      sessionsByDeckId: { [deck.id]: { currentIndex: 0 } },
      showBackText: true,
      lastSwipe: undefined,
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

    await act(async () => {
      await result.current.swipeRight();
    });

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(studyStore.getState().sessionsByDeckId[deck.id]?.currentIndex).toBe(0);
  });

  it("keeps back text visible when the long-lived config allows it", async () => {
    mocks.state = createState(createConfig({ hideBodyWhenCardChanged: false }));
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => {
      await result.current.swipeRight();
    });

    expect(studyStore.getState().showBackText).toBe(true);
  });

  it("leaves all study and card state unchanged for DoNothing", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    const before = studyStore.getState();
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => {
      await result.current.swipeDown();
    });

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(studyStore.getState()).toEqual(before);
  });

  it("removes only the route session for GoBack without a card write", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.getState().startStudy("deck-2", ["other-card"]);
    studyStore.getState().setCurrentIndex(deck.id, 1);
    studyStore.setState({ showBackText: true });
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => {
      await result.current.swipeLeft();
    });

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

    act(() => {
      result.current.updateIndex(1);
    });

    expect(studyStore.getState().sessionsByDeckId[deck.id]?.currentIndex).toBe(1);
    expect(studyStore.getState().showBackText).toBe(false);
  });

  it("finishes only the route session after the final card", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id]);
    studyStore.getState().startStudy("deck-2", ["other-card"]);
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => {
      await result.current.swipeRight();
    });

    expect(mocks.cardUpdate).toHaveBeenCalledOnce();
    expect(studyStore.getState().sessionsByDeckId[deck.id]).toBeUndefined();
    expect(studyStore.getState().sessionsByDeckId["deck-2"]).toMatchObject({ deckId: "deck-2" });
  });
});
