import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as type from "@src/action/type";
import { studyStore } from "@src/features/study/state/studyStore";
import { createConfig } from "@src/test/factories";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  state: null as RootState | null,
  dispatch: vi.fn(),
  navigate: vi.fn(),
  toggleShowBackText: vi.fn(),
  toggleAutoPlay: vi.fn(),
  swipeUp: vi.fn(),
  swipeDown: vi.fn(),
  swipeLeft: vi.fn(),
  swipeRight: vi.fn(),
  updateIndex: vi.fn(),
  resetStudy: vi.fn(),
  toggleShowHeader: vi.fn(),
  toggleShowSwipeButtonList: vi.fn(),
  useKey: vi.fn(),
}));

vi.mock("react-redux", () => ({
  useDispatch: () => mocks.dispatch,
  useSelector: (select: (state: RootState) => unknown) => {
    if (mocks.state == null) throw new Error("Mock state is not initialized");
    return select(mocks.state);
  },
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => mocks.params,
}));

vi.mock("react-use", () => ({
  useKey: mocks.useKey,
}));

vi.mock("@src/features/study/hooks/useStudyActions", () => ({
  useStudyActions: () => ({
    swipeUp: mocks.swipeUp,
    swipeDown: mocks.swipeDown,
    swipeLeft: mocks.swipeLeft,
    swipeRight: mocks.swipeRight,
    updateIndex: mocks.updateIndex,
    toggleShowBackText: mocks.toggleShowBackText,
    toggleAutoPlay: mocks.toggleAutoPlay,
    resetStudy: mocks.resetStudy,
  }),
}));

vi.mock("@src/shared/hooks/useActions", () => ({
  useActions: () => ({
    toggleShowHeader: mocks.toggleShowHeader,
    toggleShowSwipeButtonList: mocks.toggleShowSwipeButtonList,
    setDarkMode: vi.fn(),
    goToTop: vi.fn(),
    goByMenu: vi.fn(),
  }),
}));

import { DeckSwiperContainer } from "@src/features/study/containers/DeckSwiperContainer";

describe("DeckSwiperContainer with DeckSwiperTemplate", () => {
  const deck: Deck = {
    id: "deck-id",
    uid: "user-id",
    name: "Deck",
    isPublic: false,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    localMode: true,
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
    frontText: "FRONT SLOT",
    backText: "const answer = 42;",
    tags: ["typescript"],
    uniqueKey: "unique-key",
    score: 2,
    numberOfSeen: 3,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    lastSeenAt: 1,
  };
  const legacyCard: Card = {
    ...card,
    id: "legacy-card-id",
    frontText: "LEGACY FRONT",
    uniqueKey: "legacy-key",
  };

  const createState = (currentDeck: Deck = deck): RootState => ({
    deck: { byId: { [currentDeck.id]: currentDeck }, categories: [] },
    card: {
      byId: { [card.id]: card, [legacyCard.id]: legacyCard },
      tags: card.tags,
    },
    config: createConfig({
      cardInterval: 1,
      darkMode: false,
      showHeader: true,
      showSwipeButtonList: true,
    }),
  });

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mocks.params.id = deck.id;
    mocks.state = createState();
    studyStore.setState({
      session: null,
      legacyMigratedDeckIds: {},
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
    studyStore.getState().startStudy(deck.id, [card.id, legacyCard.id]);
    mocks.resetStudy.mockImplementation(() => studyStore.getState().resetStudy());
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the active session card and forwards study callbacks", () => {
    const view = render(<DeckSwiperContainer />);

    expect(view.getByText(card.frontText)).toBeVisible();
    expect(view.queryByText(legacyCard.frontText)).not.toBeInTheDocument();
    expect(view.getByText(/3 times/)).toBeVisible();
    fireEvent.click(view.getByText(card.frontText));
    fireEvent.change(view.getByRole("slider"), { target: { value: 1 } });

    expect(mocks.toggleShowBackText).toHaveBeenCalledOnce();
    expect(mocks.updateIndex).toHaveBeenCalledWith(1);
    expect(mocks.useKey).toHaveBeenCalledWith("ArrowLeft", mocks.swipeLeft);
    expect(mocks.useKey).toHaveBeenCalledWith("ArrowRight", mocks.swipeRight);
    expect(mocks.useKey).toHaveBeenCalledWith("Enter", mocks.toggleShowBackText);
    expect(mocks.useKey).toHaveBeenCalledWith(" ", mocks.toggleAutoPlay);
  });

  it("renders Zustand back text and controlled auto-play", () => {
    studyStore.setState({ showBackText: true, autoPlay: true });
    const view = render(<DeckSwiperContainer />);

    const code = view.container.querySelector("pre.typescript") as HTMLElement;
    expect(code).toHaveTextContent(card.backText);
    expect(view.getByTestId("pause")).toBeInTheDocument();
    fireEvent.click(code);
    fireEvent.click(view.getByTestId("pause"));
    fireEvent.click(view.container.querySelector(".left-0.w-20") as Element);
    fireEvent.click(view.container.querySelector(".right-0.w-20") as Element);

    expect(mocks.toggleShowBackText).toHaveBeenCalledOnce();
    expect(mocks.toggleAutoPlay).toHaveBeenCalledOnce();
    expect(mocks.swipeLeft).toHaveBeenCalledOnce();
    expect(mocks.swipeRight).toHaveBeenCalledOnce();
  });

  it("waits for and imports an eligible legacy session", async () => {
    const legacyDeck = {
      ...deck,
      currentIndex: 0,
      cardOrderIds: [card.id],
    };
    mocks.state = createState(legacyDeck);
    studyStore.getState().resetStudy();

    const view = render(<DeckSwiperContainer />);

    await waitFor(() => {
      expect(view.getByText(card.frontText)).toBeVisible();
    });
    expect(mocks.dispatch).toHaveBeenCalledTimes(1);
    expect(mocks.dispatch).toHaveBeenCalledWith(type.deckClearLegacyStudy(deck.id));
    expect(studyStore.getState().session).toEqual({
      deckId: deck.id,
      cardOrderIds: [card.id],
      currentIndex: 0,
    });
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("resets and exits when the active session belongs to another deck", async () => {
    studyStore.getState().startStudy("other-deck", [card.id]);

    render(<DeckSwiperContainer />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.resetStudy).toHaveBeenCalledOnce();
    expect(studyStore.getState().session).toBeNull();
  });

  it("resets and exits when no session or legacy candidate exists", async () => {
    studyStore.getState().resetStudy();

    render(<DeckSwiperContainer />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.resetStudy).toHaveBeenCalledOnce();
  });

  it("resets and exits at a terminal session index", async () => {
    studyStore.getState().setCurrentIndex(-1);

    render(<DeckSwiperContainer />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.resetStudy).toHaveBeenCalledOnce();
  });

  it("resets and exits when the session card is missing", async () => {
    studyStore.getState().startStudy(deck.id, ["missing-card"]);

    render(<DeckSwiperContainer />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.resetStudy).toHaveBeenCalledOnce();
  });
});
