import type { Card, CardId } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";
import type { ConfigState } from "@/shared/config";

import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createConfig } from "@/test/factories";

const mocks = vi.hoisted(() => {
  const actions = {
    swipeUp: vi.fn(),
    swipeDown: vi.fn(),
    swipeLeft: vi.fn(),
    swipeRight: vi.fn(),
    toggleShowBackText: vi.fn(),
  };

  return {
    actions,
    params: { id: "deck-id" as string | undefined },
    navigate: vi.fn(),
    cardReadStatus: "ready" as "loading" | "ready" | "error" | "blocked",
    deckReadStatus: "ready" as "loading" | "ready" | "error" | "blocked",
    cardReadRetry: vi.fn(),
    deckReadRetry: vi.fn(),
    state: null as { deck: Record<DeckId, Deck>; card: Record<CardId, Card>; config: ConfigState } | null,
    study: null as null | {
      actions: typeof actions;
      backText: { category: string | undefined; code: boolean; dark: boolean };
      card: Card | undefined;
      category: string | undefined;
      controller: {
        autoPlay: boolean;
        cardInterval: number;
        index: number;
        numberOfCards: number;
        onChange: (index: number) => void;
        onToggleAutoPlay: () => void;
      };
      showBackText: boolean;
      showController: boolean;
      showHeader: boolean;
      showSwipeButtonList: boolean;
      swipeActions: {
        disabled: boolean;
        onClickUp: () => void;
        onClickDown: () => void;
        onClickLeft: () => void;
        onClickRight: () => void;
      };
      swipeFeedback: undefined;
    },
    useStudyScreen: vi.fn(),
    onUnavailable: undefined as (() => void) | undefined,
  };
});

vi.mock("@/shared/config", () => ({
  useConfig: () => {
    if (mocks.state == null) throw new Error("Mock state is not initialized");
    return mocks.state.config;
  },
  setDarkMode: vi.fn(),
}));

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
  return { ...actual, useStudyScreen: mocks.useStudyScreen };
});

import { DeckSwiperPage } from "./DeckSwiperPage";

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

describe("DeckSwiperPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.params.id = deck.id;
    mocks.cardReadStatus = "ready";
    mocks.deckReadStatus = "ready";
    mocks.state = {
      deck: { [deck.id]: deck },
      card: { [card.id]: card },
      config: createConfig(),
    };
    mocks.study = {
      actions: mocks.actions,
      backText: { category: "typescript", code: true, dark: false },
      card,
      category: "typescript",
      controller: {
        autoPlay: false,
        cardInterval: 1,
        index: 0,
        numberOfCards: 2,
        onChange: vi.fn(),
        onToggleAutoPlay: vi.fn(),
      },
      showBackText: false,
      showController: true,
      showHeader: true,
      showSwipeButtonList: true,
      swipeActions: {
        disabled: false,
        onClickUp: mocks.actions.swipeUp,
        onClickDown: mocks.actions.swipeDown,
        onClickLeft: mocks.actions.swipeLeft,
        onClickRight: mocks.actions.swipeRight,
      },
      swipeFeedback: undefined,
    };
    mocks.onUnavailable = undefined;
    mocks.useStudyScreen.mockImplementation((options: { onUnavailable: () => void }) => {
      mocks.onUnavailable = options.onUnavailable;
      if (mocks.study == null) throw new Error("Mock study state is not initialized");
      return mocks.study;
    });
    window.history.replaceState(null, document.title, document.location.href);
  });

  it("composes the route shell from the study feature state", () => {
    render(<DeckSwiperPage />);

    expect(mocks.useStudyScreen).toHaveBeenCalledWith({
      cardsById: { [card.id]: card },
      deck,
      readsReady: true,
      onUnavailable: expect.any(Function),
    });
    expect(screen.getByText(card.frontText)).toBeVisible();
    expect(screen.getByText(/3 times/)).toBeVisible();

    fireEvent.click(screen.getByText(card.frontText));
    fireEvent.change(screen.getByRole("slider"), { target: { value: 1 } });
    expect(mocks.actions.toggleShowBackText).toHaveBeenCalledOnce();
    expect(mocks.study?.controller.onChange).toHaveBeenCalledWith(1);
  });

  it("maps the feature's unavailable intent to route navigation", () => {
    render(<DeckSwiperPage />);

    act(() => mocks.onUnavailable?.());

    expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("keeps loading and retry feedback at the route boundary", () => {
    mocks.cardReadStatus = "loading";
    if (mocks.study == null) throw new Error("Mock study state is not initialized");
    mocks.study = { ...mocks.study, card: undefined };
    render(<DeckSwiperPage />);

    expect(screen.getByRole("heading", { name: "Loading…" })).toBeInTheDocument();
    expect(mocks.useStudyScreen).toHaveBeenCalledWith(expect.objectContaining({ readsReady: false }));
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
});
