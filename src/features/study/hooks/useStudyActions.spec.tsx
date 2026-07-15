import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as type from "@src/action/type";
import { useStudyActions } from "@src/features/study/hooks/useStudyActions";
import { studyStore } from "@src/features/study/state/studyStore";

const mocks = vi.hoisted(() => ({
  state: undefined as unknown as RootState,
  dispatch: vi.fn(),
  navigate: vi.fn(),
  cardUpdate: vi.fn(),
  deckUpdate: vi.fn(),
  configUpdate: vi.fn(),
}));

vi.mock("react-redux", () => ({
  useDispatch: () => mocks.dispatch,
  useSelector: (select: (state: RootState) => unknown) => select(mocks.state),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("@src/action", () => ({
  card: { update: mocks.cardUpdate },
  deck: { update: mocks.deckUpdate },
  type: { configUpdate: mocks.configUpdate },
}));

const deck: Deck = {
  id: "deck-1",
  uid: "user-1",
  name: "Deck",
  isPublic: false,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  localMode: true,
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

const createRootState = (config = createConfig()): RootState => ({
  deck: { byId: { [deck.id]: deck }, categories: [] },
  card: { byId: { [card1.id]: card1, [card2.id]: card2 }, tags: [] },
  config,
});

describe("useStudyActions", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(946684800000);
    mocks.dispatch.mockResolvedValue(undefined);
    mocks.cardUpdate.mockImplementation((patch) => ({ type: "CARD_UPDATE", payload: patch }));
    mocks.state = createRootState();
    studyStore.setState({
      session: null,
      legacyMigratedDeckIds: {},
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("starts from filtered Redux cards before navigating", () => {
    studyStore.setState({ showBackText: true, lastSwipe: "cardSwipeLeft" });
    mocks.navigate.mockImplementationOnce(() => {
      expect(studyStore.getState()).toMatchObject({
        session: {
          deckId: deck.id,
          cardOrderIds: [card1.id],
          currentIndex: 0,
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
    expect(mocks.dispatch).not.toHaveBeenCalled();
    expect(mocks.deckUpdate).not.toHaveBeenCalled();
    expect(mocks.configUpdate).not.toHaveBeenCalled();
  });

  it("discards eligible legacy progress before starting a new session", () => {
    const legacyDeck = {
      ...deck,
      currentIndex: 1,
      cardOrderIds: [card2.id],
    } as unknown as Deck;
    mocks.state = {
      ...createRootState(),
      deck: { byId: { [legacyDeck.id]: legacyDeck }, categories: [] },
    };
    const { result } = renderHook(() => useStudyActions(deck.id));

    act(() => {
      result.current.start();
    });

    expect(mocks.dispatch).toHaveBeenCalledWith(type.deckClearLegacyStudy(deck.id));
    expect(studyStore.getState()).toMatchObject({
      session: {
        deckId: deck.id,
        cardOrderIds: [card1.id],
        currentIndex: 0,
      },
      legacyMigratedDeckIds: { [deck.id]: true },
    });
  });

  it("rejects a route and session mismatch before writing a card", async () => {
    studyStore.getState().startStudy("deck-2", [card1.id]);
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => {
      await result.current.swipeRight();
    });

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(mocks.dispatch).not.toHaveBeenCalled();
    expect(studyStore.getState().session?.deckId).toBe("deck-2");
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
    expect(mocks.dispatch).toHaveBeenCalledWith({ type: "CARD_UPDATE", payload: patch });
    expect(studyStore.getState()).toMatchObject({
      session: {
        deckId: deck.id,
        cardOrderIds: [card1.id, card2.id],
        currentIndex: 1,
      },
      lastSwipe: "cardSwipeRight",
      showBackText: false,
    });
    expect(mocks.deckUpdate).not.toHaveBeenCalled();
    expect(mocks.configUpdate).not.toHaveBeenCalled();
  });

  it("keeps back text visible when the long-lived config allows it", async () => {
    mocks.state = createRootState(createConfig({ hideBodyWhenCardChanged: false }));
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
    expect(mocks.dispatch).not.toHaveBeenCalled();
    expect(studyStore.getState()).toEqual(before);
  });

  it("sets a terminal index for GoBack without a card or deck write", async () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.getState().setCurrentIndex(1);
    studyStore.setState({ showBackText: true });
    const { result } = renderHook(() => useStudyActions(deck.id));

    await act(async () => {
      await result.current.swipeLeft();
    });

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(mocks.dispatch).not.toHaveBeenCalled();
    expect(studyStore.getState()).toMatchObject({
      session: { currentIndex: -1 },
      lastSwipe: "cardSwipeLeft",
      showBackText: true,
    });
    expect(mocks.deckUpdate).not.toHaveBeenCalled();
  });

  it("updates the session index and hides back text without Redux", () => {
    studyStore.getState().startStudy(deck.id, [card1.id, card2.id]);
    studyStore.setState({ showBackText: true });
    const { result } = renderHook(() => useStudyActions(deck.id));

    act(() => {
      result.current.updateIndex(1);
    });

    expect(studyStore.getState().session?.currentIndex).toBe(1);
    expect(studyStore.getState().showBackText).toBe(false);
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });
});
