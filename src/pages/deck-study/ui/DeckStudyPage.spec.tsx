import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { StudyCard } from "@/entities/study-progress";
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
  workflowProps: undefined as { cards: readonly StudyCard[]; deckId: string; onUnavailable: () => void } | undefined,
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return { ...actual, useDeck: () => mocks.deck };
});
vi.mock("@/entities/card", () => ({ useCardsByDeckId: () => ({ cards: mocks.cards, tags: [] }) }));
vi.mock("@/entities/preferences", () => ({
  setDarkMode: vi.fn(),
  toggleShowHeader: vi.fn(),
  toggleShowSwipeButtonList: vi.fn(),
  usePreferences: () => ({ appearance: { darkMode: false } }),
}));
vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => mocks.params,
}));
vi.mock("@/features/study", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/study")>();
  return {
    ...actual,
    useStudyCardItems: (cards: Card[]) =>
      cards.map((card) => ({
        card,
        progress: { cardId: card.id, score: 2, numberOfSeen: 3, lastSeenAt: 1 },
      })),
    StudyWorkflow: ({
      children,
      ...props
    }: { children: (state: StudyWorkflowState) => React.ReactNode } & {
      cards: readonly StudyCard[];
      deckId: string;
      onUnavailable: () => void;
    }) => {
      mocks.workflowProps = props;
      return children(mocks.workflowState);
    },
  };
});

import { DeckStudyPage } from "./DeckStudyPage";

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
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
};
const progress = { cardId: card.id, score: 2, numberOfSeen: 3, lastSeenAt: 1 };
const noop = vi.fn();
const readyState = (): StudyWorkflowState => ({
  status: "ready",
  shortcutActions: {
    swipeUp: vi.fn(),
    swipeDown: vi.fn(),
    swipeLeft: vi.fn(),
    swipeRight: vi.fn(),
    toggleShowBackText: vi.fn(),
    toggleAutoPlay: vi.fn(),
  },
  card,
  progress,
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

describe("DeckStudyPage", () => {
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
    expect(() => render(<DeckStudyPage />)).toThrow("invalid deck id");
  });

  it("passes Entity reads to StudyWorkflow and composes the application shell", () => {
    render(<DeckStudyPage />);

    expect(mocks.workflowProps).toMatchObject({ deckId: deck.id, cards: [{ card, progress }] });
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
    expect(screen.getByText(card.frontText)).toBeVisible();
    expect(screen.getByText(/3 times/)).toBeVisible();
  });

  it.each([
    ["loading", "Loading…"],
    ["unavailable", "Study session unavailable."],
  ] as const)("renders route feedback for %s workflow state", (status, title) => {
    mocks.workflowState = { status, shortcutActions: readyState().shortcutActions };
    render(<DeckStudyPage />);
    expect(screen.getByRole("heading", { name: title })).toBeVisible();
  });

  it("converts unavailable intent into current route navigation", () => {
    render(<DeckStudyPage />);
    act(() => mocks.workflowProps?.onUnavailable());
    expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("delegates a representative Study shortcut to the workflow action", () => {
    render(<DeckStudyPage />);
    const state = mocks.workflowState;
    if (state.status !== "ready") throw new Error("expected ready workflow state");

    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(state.shortcutActions.swipeLeft).toHaveBeenCalledOnce();
  });

  it("shows route feedback when the Deck Entity is unavailable", () => {
    mocks.deck = undefined;
    render(<DeckStudyPage />);
    expect(screen.getByRole("heading", { name: "Study session unavailable." })).toBeVisible();
  });

  it("installs one back-navigation guard when StrictMode replays the effect", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    const view = render(
      <React.StrictMode>
        <DeckStudyPage />
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
