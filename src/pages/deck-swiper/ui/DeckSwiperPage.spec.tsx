import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { StudyWorkflowState } from "@/features/study";

import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  deck: undefined as Deck | undefined,
  cards: [] as Card[],
  navigate: vi.fn(),
  workflowState: { status: "unavailable" } as StudyWorkflowState,
  workflowProps: undefined as
    | { cards: readonly Card[]; deckId: string; uid: string; onUnavailable: () => void }
    | undefined,
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return { ...actual, useDeck: () => mocks.deck };
});
vi.mock("@/entities/card", () => ({ useCards: () => mocks.cards }));
vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => mocks.params,
}));
vi.mock("@/features/study", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/study")>();
  return {
    ...actual,
    StudyWorkflow: ({
      children,
      ...props
    }: { children: (state: StudyWorkflowState) => React.ReactNode } & {
      cards: readonly Card[];
      deckId: string;
      uid: string;
      onUnavailable: () => void;
    }) => {
      mocks.workflowProps = props;
      return children(mocks.workflowState);
    },
  };
});

import { DeckSwiperPage } from "./DeckSwiperPage";

const deck: Deck = {
  id: "deck-id",
  uid: "user-id",
  localMode: false,
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
const noop = vi.fn();
const readyState = (): StudyWorkflowState => ({
  status: "ready",
  card,
  showHeader: true,
  showBackText: false,
  showController: true,
  showSwipeButtonList: true,
  actions: {
    swipeUp: noop,
    swipeDown: noop,
    swipeLeft: noop,
    swipeRight: noop,
    toggleShowBackText: noop,
  },
  controller: { autoPlay: false, cardInterval: 1, index: 0, numberOfCards: 1, onToggleAutoPlay: noop },
  swipeActions: { disabled: false },
});

describe("DeckSwiperPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.params.id = deck.id;
    mocks.deck = deck;
    mocks.cards = [card];
    mocks.workflowState = readyState();
    mocks.workflowProps = undefined;
    window.history.replaceState(null, document.title, document.location.href);
  });

  it("validates the route parameter", () => {
    mocks.params.id = undefined;
    expect(() => render(<DeckSwiperPage />)).toThrow("invalid deck id");
  });

  it("passes Entity reads to StudyWorkflow and composes the application shell", () => {
    render(<DeckSwiperPage />);

    expect(mocks.workflowProps).toMatchObject({ deckId: deck.id, uid: deck.uid, cards: [card] });
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
    expect(screen.getByText(card.frontText)).toBeVisible();
    expect(screen.getByText(/3 times/)).toBeVisible();
  });

  it.each([
    ["loading", "Loading…"],
    ["unavailable", "Study session unavailable."],
  ] as const)("renders route feedback for %s workflow state", (status, title) => {
    mocks.workflowState = { status };
    render(<DeckSwiperPage />);
    expect(screen.getByRole("heading", { name: title })).toBeVisible();
  });

  it("renders retryable feedback when target verification fails", () => {
    const retry = vi.fn();
    mocks.workflowState = { status: "error", retry };
    render(<DeckSwiperPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to verify study session.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("converts unavailable intent into current route navigation", () => {
    render(<DeckSwiperPage />);
    act(() => mocks.workflowProps?.onUnavailable());
    expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("shows route feedback when the Deck Entity is unavailable", () => {
    mocks.deck = undefined;
    render(<DeckSwiperPage />);
    expect(screen.getByRole("heading", { name: "Study session unavailable." })).toBeVisible();
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
