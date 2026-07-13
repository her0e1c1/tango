import React from "react";

import { cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  state: undefined as unknown as RootState,
  dispatch: vi.fn(),
  navigate: vi.fn(),
  toggleShowBackText: vi.fn(),
  swipeUp: vi.fn(),
  swipeDown: vi.fn(),
  swipeLeft: vi.fn(),
  swipeRight: vi.fn(),
  updateIndex: vi.fn(),
  useKey: vi.fn(),
}));

vi.mock("react-redux", () => ({
  useDispatch: () => mocks.dispatch,
  useSelector: (select: (state: RootState) => unknown) => select(mocks.state),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => mocks.params,
}));

vi.mock("react-use", () => ({
  useKey: mocks.useKey,
}));

vi.mock("@src/action", () => ({
  deck: { update: vi.fn() },
}));

vi.mock("@src/features/deck/containers/useDeckActions", () => ({
  useDeckActions: () => ({
    swipeUp: mocks.swipeUp,
    swipeDown: mocks.swipeDown,
    swipeLeft: mocks.swipeLeft,
    swipeRight: mocks.swipeRight,
    updateIndex: mocks.updateIndex,
  }),
}));

vi.mock("@src/shared/hooks/useActions", () => ({
  useActions: () => ({
    toggleShowBackText: mocks.toggleShowBackText,
    toggleShowHeader: vi.fn(),
    toggleShowSwipeButtonList: vi.fn(),
    toggleAutoPlay: vi.fn(),
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
    currentIndex: 0,
    category: "raw",
    convertToBr: false,
    cardOrderIds: ["card-id", "next-card-id"],
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

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.params.id = deck.id;
    mocks.state = {
      deck: { byId: { [deck.id]: deck }, categories: [] },
      card: { byId: { [card.id]: card }, tags: card.tags },
      config: {
        autoPlay: false,
        cardInterval: 1,
        darkMode: false,
        showBackText: false,
        showHeader: true,
        showSwipeButtonList: true,
      } as ConfigState,
    };
  });

  afterEach(() => {
    cleanup();
  });

  it("composes front and card-overlay slots and forwards front and controller callbacks", () => {
    const view = render(<DeckSwiperContainer />);

    expect(view.getByText(card.frontText)).toBeVisible();
    expect(view.getByText(/3 times/)).toBeVisible();
    fireEvent.click(view.getByText(card.frontText));
    fireEvent.change(view.getByRole("slider"), { target: { value: 1 } });

    expect(mocks.toggleShowBackText).toHaveBeenCalledOnce();
    expect(mocks.updateIndex).toHaveBeenCalledWith(1);
    expect(mocks.useKey).toHaveBeenCalledWith("ArrowLeft", mocks.swipeLeft);
    expect(mocks.useKey).toHaveBeenCalledWith("ArrowRight", mocks.swipeRight);
  });

  it("composes the language back slot and forwards swipe and back callbacks", () => {
    mocks.state = {
      ...mocks.state,
      config: { ...mocks.state.config, showBackText: true },
    };
    const view = render(<DeckSwiperContainer />);

    const code = view.container.querySelector("pre.typescript") as HTMLElement;
    expect(code).toHaveTextContent(card.backText);
    fireEvent.click(code);
    fireEvent.click(view.container.querySelector(".left-0.w-20") as Element);
    fireEvent.click(view.container.querySelector(".right-0.w-20") as Element);

    expect(mocks.toggleShowBackText).toHaveBeenCalledOnce();
    expect(mocks.swipeLeft).toHaveBeenCalledOnce();
    expect(mocks.swipeRight).toHaveBeenCalledOnce();
  });
});
