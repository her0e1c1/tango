/**
 * @file Verifies the "DeckSwiperContainer with DeckSwiperTemplate" contract with automated
 * examples.
 * The examples make the expected behavior concrete with cases such as "renders the active session
 * card and forwards study callbacks", "keeps pending study saves silent while disabling swipe
 * controls", "installs one back-navigation guard when StrictMode replays the effect".
 */

import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { studyStore } from "@/features/study/state/studyStore";
import { createConfig } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  state: null as { deck: Record<DeckId, Deck>; card: Record<CardId, Card>; config: ConfigState } | null,
  navigate: vi.fn(),
  toggleShowBackText: vi.fn(),
  toggleAutoPlay: vi.fn(),
  swipeUp: vi.fn(),
  swipeDown: vi.fn(),
  swipeLeft: vi.fn(),
  swipeRight: vi.fn(),
  updateIndex: vi.fn(),
  resetStudy: vi.fn(),
  pending: false,
  error: null as unknown,
  retry: vi.fn(),
  hydrated: true,
  toggleShowHeader: vi.fn(),
  toggleShowSwipeButtonList: vi.fn(),
  useKey: vi.fn(),
}));

vi.mock("@/hooks/useConfig", () => ({
  useConfig: () => {
    if (mocks.state == null) throw new Error("Mock state is not initialized");
    return mocks.state.config;
  },
}));

vi.mock("@/query/useRemoteCollections", () => ({
  useRemoteCollections: () => ({
    status: "ready" as const,
    retry: vi.fn(),
    deckById: (id: string) => mocks.state?.deck[id],
    cardById: (id: string) => mocks.state?.card[id],
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => mocks.params,
}));

vi.mock("react-use", () => ({
  useKey: mocks.useKey,
}));

vi.mock("@/features/study/hooks/useStudyActions", () => ({
  useStudyActions: () => ({
    swipeUp: mocks.swipeUp,
    swipeDown: mocks.swipeDown,
    swipeLeft: mocks.swipeLeft,
    swipeRight: mocks.swipeRight,
    updateIndex: mocks.updateIndex,
    toggleShowBackText: mocks.toggleShowBackText,
    toggleAutoPlay: mocks.toggleAutoPlay,
    resetStudy: mocks.resetStudy,
    pending: mocks.pending,
    error: mocks.error,
    retry: mocks.retry,
  }),
}));

vi.mock("@/features/study/hooks/useStudyHydrated", () => ({
  useStudyHydrated: () => mocks.hydrated,
}));

vi.mock("@/hooks/useActions", () => ({
  useActions: () => ({
    toggleShowHeader: mocks.toggleShowHeader,
    toggleShowSwipeButtonList: mocks.toggleShowSwipeButtonList,
    setDarkMode: vi.fn(),
    goToTop: vi.fn(),
    goByMenu: vi.fn(),
  }),
}));

import { DeckSwiperContainer } from "@/features/study/containers/DeckSwiperContainer";

describe("DeckSwiperContainer with DeckSwiperTemplate", () => {
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

  const createState = (currentDeck: Deck = deck) => ({
    deck: { [currentDeck.id]: currentDeck },
    card: { [card.id]: card, [legacyCard.id]: legacyCard },
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
    mocks.hydrated = true;
    mocks.pending = false;
    mocks.error = null;
    window.history.replaceState(null, document.title, document.location.href);
    studyStore.setState({
      sessionsByDeckId: {},
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
    studyStore.getState().startStudy(deck.id, [card.id, legacyCard.id]);
    mocks.resetStudy.mockImplementation(() => studyStore.getState().removeStudy(deck.id));
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

  it("keeps pending study saves silent while disabling swipe controls", () => {
    mocks.pending = true;

    const view = render(<DeckSwiperContainer />);

    expect(view.queryByText("Saving…")).not.toBeInTheDocument();
    for (const name of ["Swipe up", "Swipe down", "Swipe left", "Swipe right"]) {
      expect(view.getByRole("button", { name })).toBeDisabled();
    }
  });

  it("installs one back-navigation guard when StrictMode replays the effect", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    const view = render(
      <StrictMode>
        <DeckSwiperContainer />
      </StrictMode>
    );

    expect(pushState).toHaveBeenCalledOnce();
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(mocks.navigate).toHaveBeenCalledWith(1);

    view.unmount();
    mocks.navigate.mockClear();
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("updates the route session activity when the study screen opens", () => {
    studyStore.setState((state) => {
      const session = state.sessionsByDeckId[deck.id];
      if (session == null) return state;
      return {
        sessionsByDeckId: {
          ...state.sessionsByDeckId,
          [deck.id]: { ...session, lastStudiedAt: 100 },
        },
      };
    });
    studyStore.setState({ showBackText: true, autoPlay: true, lastSwipe: "cardSwipeLeft" });
    const now = vi.spyOn(Date, "now").mockReturnValue(9000);

    render(<DeckSwiperContainer />);

    expect(studyStore.getState().sessionsByDeckId[deck.id]?.lastStudiedAt).toBe(9000);
    expect(studyStore.getState()).toMatchObject({ showBackText: false, autoPlay: false, lastSwipe: undefined });
    now.mockRestore();
  });

  it("renders Zustand back text and controlled auto-play", () => {
    const view = render(<DeckSwiperContainer />);
    act(() => studyStore.setState({ showBackText: true, autoPlay: true }));

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

  it("waits for hydration, then rejects an old-shaped deck without a current session", async () => {
    const legacyDeck = {
      ...deck,
      currentIndex: 0,
      cardOrderIds: [card.id],
    };
    mocks.state = createState(legacyDeck);
    studyStore.getState().removeStudy(deck.id);
    mocks.hydrated = false;

    const view = render(<DeckSwiperContainer />);

    expect(view.getByRole("status")).toHaveTextContent("Study session unavailable.");
    expect(mocks.resetStudy).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(studyStore.getState().sessionsByDeckId[deck.id]).toBeUndefined();

    mocks.hydrated = true;
    view.rerender(<DeckSwiperContainer />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.resetStudy).toHaveBeenCalledOnce();
    expect(studyStore.getState().sessionsByDeckId[deck.id]).toBeUndefined();
  });

  it("exits without removing a session that belongs to another deck", async () => {
    studyStore.getState().removeStudy(deck.id);
    studyStore.getState().startStudy("other-deck", [card.id]);

    render(<DeckSwiperContainer />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.resetStudy).toHaveBeenCalledOnce();
    expect(studyStore.getState().sessionsByDeckId["other-deck"]).toMatchObject({ deckId: "other-deck" });
  });

  it("resets and exits when no session or legacy candidate exists", async () => {
    studyStore.getState().removeStudy(deck.id);

    render(<DeckSwiperContainer />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.resetStudy).toHaveBeenCalledOnce();
  });

  it("resets and exits at a terminal session index", async () => {
    const session = studyStore.getState().sessionsByDeckId[deck.id];
    if (session == null) throw new Error("Expected an active study session");
    studyStore.setState((state) => ({
      sessionsByDeckId: {
        ...state.sessionsByDeckId,
        [deck.id]: { ...session, currentIndex: -1 },
      },
    }));

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
