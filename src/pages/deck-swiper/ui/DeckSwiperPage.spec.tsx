/**
 * @file Verifies the "DeckSwiperPage with DeckSwiperView" contract with automated
 * examples.
 * The examples make the expected behavior concrete with cases such as "renders the active session
 * card and forwards study callbacks", "keeps pending study saves silent while disabling swipe
 * controls", "installs one back-navigation guard when StrictMode replays the effect".
 */

import type { Card, CardId } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";
import type { ConfigState, SwipeDirection } from "@/shared/config";

import { act, fireEvent, render, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { useStudySessions } from "@/features/study";
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
  cardMutation: {
    update: vi.fn(),
  },
  studyState: {
    sessionsByDeckId: {} as ReturnType<typeof useStudySessions>,
    showBackText: false,
    autoPlay: false,
    lastSwipe: undefined as { direction: SwipeDirection; eventId: number } | undefined,
    clearLastSwipe: vi.fn(),
  },
  initializeStudySessionUi: vi.fn(),
  touchStudySession: vi.fn(),
  hydrated: true,
  cardReadStatus: "ready" as "loading" | "ready" | "error" | "blocked",
  deckReadStatus: "ready" as "loading" | "ready" | "error" | "blocked",
  cardReadRetry: vi.fn(),
  deckReadRetry: vi.fn(),
  toggleShowHeader: vi.fn(),
  toggleShowSwipeButtonList: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));

vi.mock("@/shared/config", () => ({
  useConfig: () => {
    if (mocks.state == null) throw new Error("Mock state is not initialized");
    return mocks.state.config;
  },
  toggleShowHeader: mocks.toggleShowHeader,
  toggleShowSwipeButtonList: mocks.toggleShowSwipeButtonList,
  setDarkMode: mocks.setDarkMode,
}));

vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
  };
});
vi.mock("@/features/deck/read", () => ({
  useDecks: () => ({
    status: mocks.deckReadStatus,
    retry: mocks.deckReadRetry,
    decksById: mocks.state?.deck ?? {},
  }),
}));

vi.mock("@/features/card/read", () => ({
  useCards: () => ({
    status: mocks.cardReadStatus,
    retry: mocks.cardReadRetry,
    cardsById: mocks.state?.card ?? {},
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => mocks.params,
}));

vi.mock("@/features/study", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/study")>();
  return {
    ...actual,
    initializeStudySessionUi: mocks.initializeStudySessionUi,
    touchStudySession: mocks.touchStudySession,
    useEditStudyProgress: () => mocks.cardMutation,
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
    useStudyHydrated: () => mocks.hydrated,
    useStudyStore: (selector: (state: typeof mocks.studyState) => unknown) => selector(mocks.studyState),
  };
});

import { DeckSwiperPage } from "./DeckSwiperPage";

describe("DeckSwiperPage with DeckSwiperView", () => {
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
    mocks.cardReadStatus = "ready";
    mocks.deckReadStatus = "ready";
    mocks.studyState.sessionsByDeckId = {
      [deck.id]: {
        deckId: deck.id,
        cardOrderIds: [card.id, legacyCard.id],
        currentIndex: 0,
        lastStudiedAt: 0,
      },
    };
    mocks.studyState.showBackText = false;
    mocks.studyState.autoPlay = false;
    mocks.studyState.lastSwipe = undefined;
    mocks.studyState.clearLastSwipe.mockImplementation(() => {
      mocks.studyState.lastSwipe = undefined;
    });
    mocks.initializeStudySessionUi.mockImplementation((defaultAutoPlay: boolean) => {
      mocks.studyState.showBackText = false;
      mocks.studyState.autoPlay = defaultAutoPlay;
      mocks.studyState.lastSwipe = undefined;
    });
    mocks.touchStudySession.mockImplementation((deckId: DeckId) => {
      const session = mocks.studyState.sessionsByDeckId[deckId];
      if (session != null) {
        mocks.studyState.sessionsByDeckId[deckId] = { ...session, lastStudiedAt: Date.now() };
      }
    });
    window.history.replaceState(null, document.title, document.location.href);
    mocks.resetStudy.mockImplementation(() => {
      const { [deck.id]: _removed, ...sessionsByDeckId } = mocks.studyState.sessionsByDeckId;
      mocks.studyState.sessionsByDeckId = sessionsByDeckId;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the active session card and responds to study controls", () => {
    render(<DeckSwiperPage />);

    expect(screen.getByText(card.frontText)).toBeVisible();
    expect(screen.queryByText(legacyCard.frontText)).not.toBeInTheDocument();
    expect(screen.getByText(/3 times/)).toBeVisible();
    fireEvent.click(screen.getByText(card.frontText));
    fireEvent.change(screen.getByRole("slider"), { target: { value: 1 } });

    expect(mocks.toggleShowBackText).toHaveBeenCalledOnce();
    expect(mocks.updateIndex).toHaveBeenCalledWith(1);

    mocks.toggleShowBackText.mockClear();
    fireEvent.keyDown(window, { key: "ArrowUp" });
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "h" });
    fireEvent.keyDown(window, { key: "b" });
    fireEvent.keyDown(window, { key: " " });

    expect(mocks.swipeUp).toHaveBeenCalledOnce();
    expect(mocks.swipeDown).toHaveBeenCalledOnce();
    expect(mocks.swipeLeft).toHaveBeenCalledOnce();
    expect(mocks.swipeRight).toHaveBeenCalledOnce();
    expect(mocks.toggleShowBackText).toHaveBeenCalledOnce();
    expect(mocks.toggleShowHeader).toHaveBeenCalledOnce();
    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledOnce();
    expect(mocks.toggleAutoPlay).toHaveBeenCalledOnce();
  });

  it("owns header visibility across front and back content", () => {
    const view = render(<DeckSwiperPage />);

    expect(screen.getByRole("button", { name: "tango" })).toBeInTheDocument();

    mocks.studyState.showBackText = true;
    view.rerender(<DeckSwiperPage />);

    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();

    mocks.studyState.showBackText = false;
    if (mocks.state == null) throw new Error("Mock state is not initialized");
    mocks.state.config = createConfig({
      ...mocks.state.config,
      appearance: { ...mocks.state.config.appearance, showHeader: false },
    });
    view.rerender(<DeckSwiperPage />);

    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
  });

  it("renders the application shell for the ready study screen", () => {
    render(<DeckSwiperPage />);

    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("shows the last swipe briefly only when feedback is enabled", () => {
    vi.useFakeTimers();
    if (mocks.state == null) throw new Error("Mock state is not initialized");
    mocks.state.config = createConfig({
      ...mocks.state.config,
      appearance: { ...mocks.state.config.appearance, showSwipeFeedback: true },
    });
    const view = render(<DeckSwiperPage />);

    mocks.studyState.lastSwipe = { direction: "cardSwipeLeft", eventId: 1 };
    view.rerender(<DeckSwiperPage />);
    expect(screen.getByText("Swiped left")).toHaveAttribute("role", "status");

    act(() => vi.advanceTimersByTime(899));
    expect(screen.getByText("Swiped left")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    view.rerender(<DeckSwiperPage />);
    expect(screen.queryByText("Swiped left")).not.toBeInTheDocument();

    mocks.state.config = createConfig({
      ...mocks.state.config,
      appearance: { ...mocks.state.config.appearance, showSwipeFeedback: false },
    });
    mocks.studyState.lastSwipe = { direction: "cardSwipeRight", eventId: 2 };
    view.rerender(<DeckSwiperPage />);
    expect(screen.queryByText("Swiped right")).not.toBeInTheDocument();
  });

  it("restarts swipe feedback timing for repeated identical swipes", () => {
    vi.useFakeTimers();
    if (mocks.state == null) throw new Error("Mock state is not initialized");
    mocks.state.config = createConfig({
      ...mocks.state.config,
      appearance: { ...mocks.state.config.appearance, showSwipeFeedback: true },
    });
    const view = render(<DeckSwiperPage />);

    mocks.studyState.lastSwipe = { direction: "cardSwipeLeft", eventId: 1 };
    view.rerender(<DeckSwiperPage />);
    act(() => vi.advanceTimersByTime(500));
    mocks.studyState.lastSwipe = { direction: "cardSwipeLeft", eventId: 2 };
    view.rerender(<DeckSwiperPage />);

    act(() => vi.advanceTimersByTime(899));
    expect(screen.getByText("Swiped left")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    view.rerender(<DeckSwiperPage />);
    expect(screen.queryByText("Swiped left")).not.toBeInTheDocument();
  });

  it("installs one back-navigation guard when StrictMode replays the effect", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    const view = render(
      <React.StrictMode>
        <DeckSwiperPage />
      </React.StrictMode>
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
    const session = mocks.studyState.sessionsByDeckId[deck.id];
    if (session == null) throw new Error("Expected an active study session");
    mocks.studyState.sessionsByDeckId[deck.id] = { ...session, lastStudiedAt: 100 };
    mocks.studyState.showBackText = true;
    mocks.studyState.autoPlay = true;
    mocks.studyState.lastSwipe = { direction: "cardSwipeLeft", eventId: 1 };
    const now = vi.spyOn(Date, "now").mockReturnValue(9000);

    render(<DeckSwiperPage />);

    expect(mocks.initializeStudySessionUi).toHaveBeenCalledWith(false);
    expect(mocks.touchStudySession).toHaveBeenCalledWith(deck.id);
    expect(mocks.studyState.sessionsByDeckId[deck.id]?.lastStudiedAt).toBe(9000);
    expect(mocks.studyState).toMatchObject({ showBackText: false, autoPlay: false, lastSwipe: undefined });
    now.mockRestore();
  });

  it("renders Zustand back text and controlled auto-play", () => {
    const view = render(<DeckSwiperPage />);
    mocks.studyState.showBackText = true;
    mocks.studyState.autoPlay = true;
    view.rerender(<DeckSwiperPage />);

    const code = screen.getByText(/answer =/);
    expect(code).toHaveTextContent(card.backText);
    expect(screen.getByTestId("pause")).toBeInTheDocument();
    fireEvent.click(code);
    fireEvent.click(screen.getByTestId("pause"));
    const swipeLeftButton = screen.getAllByRole("button", { name: "Swipe left" })[0];
    const swipeRightButton = screen.getAllByRole("button", { name: "Swipe right" })[0];
    if (swipeLeftButton == null || swipeRightButton == null) throw new Error("Expected swipe controls");
    fireEvent.click(swipeLeftButton);
    fireEvent.click(swipeRightButton);

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
    delete mocks.studyState.sessionsByDeckId[deck.id];
    mocks.hydrated = false;

    const view = render(<DeckSwiperPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Study session unavailable.");
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    expect(mocks.resetStudy).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.studyState.sessionsByDeckId[deck.id]).toBeUndefined();

    mocks.hydrated = true;
    view.rerender(<DeckSwiperPage />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.resetStudy).toHaveBeenCalledOnce();
    expect(mocks.studyState.sessionsByDeckId[deck.id]).toBeUndefined();
  });

  it("exits without removing a session that belongs to another deck", async () => {
    delete mocks.studyState.sessionsByDeckId[deck.id];
    mocks.studyState.sessionsByDeckId["other-deck"] = {
      deckId: "other-deck",
      cardOrderIds: [card.id],
      currentIndex: 0,
      lastStudiedAt: 0,
    };

    render(<DeckSwiperPage />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.resetStudy).toHaveBeenCalledOnce();
    expect(mocks.studyState.sessionsByDeckId["other-deck"]).toMatchObject({ deckId: "other-deck" });
  });

  it("resets and exits when no session or legacy candidate exists", async () => {
    delete mocks.studyState.sessionsByDeckId[deck.id];

    render(<DeckSwiperPage />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.resetStudy).toHaveBeenCalledOnce();
  });

  it("resets and exits at a terminal session index", async () => {
    const session = mocks.studyState.sessionsByDeckId[deck.id];
    if (session == null) throw new Error("Expected an active study session");
    mocks.studyState.sessionsByDeckId[deck.id] = { ...session, currentIndex: -1 };

    render(<DeckSwiperPage />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.resetStudy).toHaveBeenCalledOnce();
  });

  it("resets and exits when the session card is missing", async () => {
    mocks.studyState.sessionsByDeckId[deck.id] = {
      deckId: deck.id,
      cardOrderIds: ["missing-card"],
      currentIndex: 0,
      lastStudiedAt: 0,
    };

    render(<DeckSwiperPage />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.resetStudy).toHaveBeenCalledOnce();
  });

  it("keeps the study session while Card reads are still loading", () => {
    mocks.cardReadStatus = "loading";
    if (mocks.state == null) throw new Error("Mock state is not initialized");
    mocks.state.card = {};

    render(<DeckSwiperPage />);

    expect(screen.getByRole("heading", { name: "Loading…" })).toBeInTheDocument();
    expect(mocks.resetStudy).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalledWith("/", { replace: true });
    expect(mocks.studyState.sessionsByDeckId[deck.id]).toBeDefined();
  });
});
