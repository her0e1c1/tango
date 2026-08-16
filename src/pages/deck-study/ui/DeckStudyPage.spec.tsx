import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { StudyState } from "@/features/study";

import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  deck: undefined as Deck | undefined,
  cards: [] as Card[],
  navigate: vi.fn(),
  studyState: undefined as StudyState | undefined,
  studyArgs: undefined as { cards: readonly Card[]; deckId: string; onInvalid: () => void } | undefined,
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
    useStudy: (deckId: string, cards: readonly Card[], onInvalid: () => void) => {
      mocks.studyArgs = { deckId, cards, onInvalid };
      if (mocks.studyState == null) throw new Error("Study state not initialized");
      return mocks.studyState;
    },
  };
});

import { DeckStudyPage } from "./DeckStudyPage";

const deck: Deck = {
  id: "deck-id",
  localMode: false,
  name: "Deck",
  isPublic: false,
  createdAt: 0,
  updatedAt: 0,
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
const commands = () => ({
  swipeUp: vi.fn(),
  swipeDown: vi.fn(),
  swipeLeft: vi.fn(),
  swipeRight: vi.fn(),
  toggleBackText: vi.fn(),
  toggleAutoPlay: vi.fn(),
});
const studyingState = (): StudyState => ({
  status: "studying",
  ...commands(),
  session: {
    deckId: deck.id,
    cardOrderIds: [card.id],
    currentIndex: 0,
    lastStudiedAt: 0,
  },
  card,
  showHeader: true,
  showBackText: false,
  showController: true,
  showSwipeButtonList: true,
  autoPlay: false,
  updateIndex: noop,
});

describe("DeckStudyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.params.id = deck.id;
    mocks.deck = deck;
    mocks.cards = [card];
    mocks.studyState = studyingState();
    mocks.studyArgs = undefined;
    window.history.replaceState(null, document.title, document.location.href);
  });

  it("validates the route parameter", () => {
    mocks.params.id = undefined;
    expect(() => render(<DeckStudyPage />)).toThrow("invalid deck id");
  });

  it("passes Entity reads to useStudy and composes the application shell", () => {
    render(<DeckStudyPage />);

    expect(mocks.studyArgs).toMatchObject({ deckId: deck.id, cards: [card] });
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
    expect(screen.getByText(card.frontText)).toBeVisible();
    expect(screen.getByText(/3 times/)).toBeVisible();
  });

  it.each([
    ["preparing", "Loading…"],
    ["invalid", "Study session unavailable."],
  ] as const)("renders route feedback for %s workflow state", (status, title) => {
    mocks.studyState = { status, ...commands() };
    render(<DeckStudyPage />);
    expect(screen.getByRole("heading", { name: title })).toBeVisible();
  });

  it("converts invalid session intent into current route navigation", () => {
    render(<DeckStudyPage />);
    act(() => mocks.studyArgs?.onInvalid());
    expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("delegates a representative Study shortcut to the workflow action", () => {
    render(<DeckStudyPage />);
    const state = mocks.studyState;
    if (state?.status !== "studying") throw new Error("expected studying workflow state");

    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(state.swipeLeft).toHaveBeenCalledOnce();
  });

  it("shows route feedback when the Deck Entity is unavailable", () => {
    mocks.deck = undefined;
    render(<DeckStudyPage />);
    expect(screen.getByRole("heading", { name: "Study session unavailable." })).toBeVisible();
  });
});
