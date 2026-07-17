import { cleanup, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { studyStore } from "@/features/study/state/studyStore";
import { createConfig, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  config: {} as ConfigState,
  decksById: {} as Record<DeckId, Deck>,
  cardsById: {} as Record<CardId, Card>,
  actions: {
    goToSettings: vi.fn(),
    goToImport: vi.fn(),
    setDarkMode: vi.fn(),
    goToTop: vi.fn(),
    goByMenu: vi.fn(),
    goToEdit: vi.fn(),
    goToView: vi.fn(),
    goToStudy: vi.fn(),
    goToStart: vi.fn(),
    deckDownload: vi.fn(),
    deckRemove: vi.fn(),
  },
}));

vi.mock("@/features/settings/hooks/useConfig", () => ({ useConfig: () => mocks.config }));

vi.mock("@/action", () => ({ deck: { downloadData: vi.fn() } }));
vi.mock("@/query/useRemoteCollections", () => ({
  useRemoteCollections: () => {
    const decksById = mocks.decksById;
    return {
      status: "ready" as const,
      retry: vi.fn(),
      decks: Object.values(decksById).filter((deck): deck is Deck => deck != null),
      deckById: (id: string) => decksById[id],
      cardsByDeckId: (id: string) => Object.values(mocks.cardsById).filter((card) => card.deckId === id),
    };
  },
}));

vi.mock("react-use", () => ({
  useKey: vi.fn(),
}));

vi.mock("@/shared/hooks/useActions", () => ({
  useActions: () => mocks.actions,
}));

vi.mock("@/features/deck/hooks/useDeckMutations", () => ({
  useDeckMutations: () => ({ remove: vi.fn(), pending: false, error: null, retry: vi.fn() }),
}));

import { DeckListContainer } from "@/features/deck/containers/DeckListContainer";

describe("DeckListContainer", () => {
  const activeDeck = createDeck({
    id: "active-deck",
    name: "Active deck",
    category: "math",
    isPublic: false,
    url: "",
  });
  const otherDeck = {
    ...activeDeck,
    id: "other-deck",
    name: "Other deck",
  };

  beforeEach(() => {
    localStorage.clear();
    mocks.decksById = { [activeDeck.id]: activeDeck, [otherDeck.id]: otherDeck };
    mocks.cardsById = {};
    mocks.config = createConfig({ darkMode: false });
    studyStore.setState({
      session: {
        deckId: activeDeck.id,
        cardOrderIds: ["card-1", "card-2", "card-3"],
        currentIndex: 1,
      },
    });
  });

  afterEach(() => {
    cleanup();
    studyStore.getState().resetStudy();
  });

  it("renders progress only on the deck that owns the active session", () => {
    const view = render(<DeckListContainer />);

    expect(view.getByText("studying 2 card(s) from 3")).toBeInTheDocument();
    const restartButtons = view.getAllByRole("button", { name: "Restart" });
    expect(restartButtons[0]).toBeEnabled();
    expect(restartButtons[1]).toBeDisabled();
  });

  it("ignores legacy study fields when there is no current session", () => {
    const legacyDeck = {
      ...activeDeck,
      currentIndex: 1,
      cardOrderIds: ["card-1", "card-2"],
    } satisfies Deck & { currentIndex: number; cardOrderIds: string[] };
    mocks.decksById = { [legacyDeck.id]: legacyDeck, [otherDeck.id]: otherDeck };
    studyStore.getState().resetStudy();

    const view = render(<DeckListContainer />);

    const restartButtons = view.getAllByRole("button", { name: "Restart" });
    expect(restartButtons[0]).toBeDisabled();
    expect(restartButtons[1]).toBeDisabled();
    expect(view.queryByText(/studying/)).not.toBeInTheDocument();
  });
});
