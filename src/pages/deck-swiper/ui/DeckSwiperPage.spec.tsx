import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { ActiveStudyWorkflowState } from "@/features/study";

import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface WorkflowProps {
  cards: readonly Card[];
  deckId: string;
  deckName: string;
  onExit: (deckId: string) => void;
  onSetupStudy: (deckId: string) => void;
  onBackToDeck: (deckId: string) => void;
}

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  deck: undefined as Deck | undefined,
  cards: [] as Card[],
  navigate: vi.fn(),
  workflowState: undefined as ActiveStudyWorkflowState | undefined,
  workflowProps: undefined as WorkflowProps | undefined,
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
    }: { children: (state: ActiveStudyWorkflowState) => React.ReactNode } & WorkflowProps) => {
      mocks.workflowProps = props;
      if (mocks.workflowState == null) throw new Error("Workflow state not initialized");
      return children(mocks.workflowState);
    },
  };
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
const noop = vi.fn();
const activeState = (): ActiveStudyWorkflowState => ({
  status: "active",
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
    mocks.workflowState = activeState();
    mocks.workflowProps = undefined;
  });

  it("validates the route parameter", () => {
    mocks.params.id = undefined;
    expect(() => render(<DeckSwiperPage />)).toThrow("invalid deck id");
  });

  it("passes Entity reads and Deck presentation to StudyWorkflow", () => {
    render(<DeckSwiperPage />);

    expect(mocks.workflowProps).toMatchObject({ deckId: deck.id, deckName: deck.name, cards: [card] });
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
    expect(screen.getByText(card.frontText)).toBeVisible();
    expect(screen.getByText(/3 times/)).toBeVisible();
  });

  it("maps Study navigation intents without installing a browser Back trap", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    render(<DeckSwiperPage />);

    act(() => mocks.workflowProps?.onExit(deck.id));
    expect(mocks.navigate).toHaveBeenCalledWith(`/deck/${deck.id}`, { replace: true });
    act(() => mocks.workflowProps?.onSetupStudy(deck.id));
    expect(mocks.navigate).toHaveBeenCalledWith(`/deck/${deck.id}/start`);
    act(() => mocks.workflowProps?.onBackToDeck(deck.id));
    expect(mocks.navigate).toHaveBeenLastCalledWith(`/deck/${deck.id}`, { replace: true });
    expect(pushState).not.toHaveBeenCalled();
  });

  it("shows missing Deck recovery with only Go home", () => {
    mocks.deck = undefined;
    render(<DeckSwiperPage />);
    expect(screen.getByRole("heading", { name: "Deck not found" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Back to deck" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Go home" }));
    expect(mocks.navigate).toHaveBeenCalledWith("/");
  });
});
