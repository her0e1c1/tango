import React from "react";

import { cleanup, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { studyStore } from "@src/features/study/state/studyStore";

const mocks = vi.hoisted(() => ({
  state: undefined as unknown as RootState,
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

vi.mock("react-redux", () => ({
  useSelector: (select: (state: RootState) => unknown) => select(mocks.state),
}));

vi.mock("react-use", () => ({
  useKey: vi.fn(),
}));

vi.mock("@src/shared/hooks/useActions", () => ({
  useActions: () => mocks.actions,
}));

import { DeckListContainer } from "@src/features/deck/containers/DeckListContainer";

describe("DeckListContainer", () => {
  const activeDeck = {
    id: "active-deck",
    name: "Active deck",
    category: "math",
    isPublic: false,
    url: "",
  } as Deck;
  const otherDeck = {
    ...activeDeck,
    id: "other-deck",
    name: "Other deck",
  };

  beforeEach(() => {
    localStorage.clear();
    mocks.state = {
      deck: { byId: { [activeDeck.id]: activeDeck, [otherDeck.id]: otherDeck }, categories: [] },
      card: { byId: {}, tags: [] },
      config: { darkMode: false } as ConfigState,
    };
    studyStore.setState({
      session: {
        deckId: activeDeck.id,
        cardOrderIds: ["card-1", "card-2", "card-3"],
        currentIndex: 1,
      },
      legacyMigratedDeckIds: {},
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

  it("enables restart for an eligible legacy study session", () => {
    const legacyDeck = {
      ...activeDeck,
      currentIndex: 1,
      cardOrderIds: ["card-1", "card-2"],
    } as unknown as Deck;
    mocks.state = {
      ...mocks.state,
      deck: { byId: { [legacyDeck.id]: legacyDeck, [otherDeck.id]: otherDeck }, categories: [] },
    };
    studyStore.getState().resetStudy();

    const view = render(<DeckListContainer />);

    const restartButtons = view.getAllByRole("button", { name: "Restart" });
    expect(restartButtons[0]).toBeEnabled();
    expect(restartButtons[1]).toBeDisabled();
    expect(view.queryByText(/studying/)).not.toBeInTheDocument();
  });

  it("keeps restart disabled for a legacy session already marked as migrated", () => {
    const legacyDeck = {
      ...activeDeck,
      currentIndex: 1,
      cardOrderIds: ["card-1", "card-2"],
    } as unknown as Deck;
    mocks.state = {
      ...mocks.state,
      deck: { byId: { [legacyDeck.id]: legacyDeck, [otherDeck.id]: otherDeck }, categories: [] },
    };
    studyStore.setState({
      session: null,
      legacyMigratedDeckIds: { [legacyDeck.id]: true },
    });

    const view = render(<DeckListContainer />);

    const restartButtons = view.getAllByRole("button", { name: "Restart" });
    expect(restartButtons[0]).toBeDisabled();
    expect(restartButtons[1]).toBeDisabled();
  });
});
