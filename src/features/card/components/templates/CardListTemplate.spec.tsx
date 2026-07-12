import React from "react";

import userEvent from "@testing-library/user-event";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  state: undefined as unknown as RootState,
}));

vi.mock("react-redux", () => ({
  useSelector: (select: (state: RootState) => unknown) => select(mocks.state),
}));

vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
}));

vi.mock("react-use", () => ({
  useKey: vi.fn(),
}));

vi.mock("@src/shared/hooks/useActions", () => ({
  useActions: () => ({
    goToTop: vi.fn(),
    goToSettings: vi.fn(),
    goByMenu: vi.fn(),
    setDarkMode: vi.fn(),
    cardUpdateBy: vi.fn(() => vi.fn()),
    goToCardEdit: vi.fn(),
    cardRemove: vi.fn(),
  }),
}));

vi.mock("@src/features/deck/containers/useDeckActions", () => ({
  useDeckActions: () => ({ update: vi.fn() }),
}));

vi.mock("@src/features/deck/containers/useDeckFilterState", () => ({
  useDeckFilterState: () => ({
    scoreMax: null,
    scoreMin: null,
    scoreMaxSwitchProps: { name: "scoreMaxSwitch" },
    scoreMinSwitchProps: { name: "scoreMinSwitch" },
    scoreMaxSliderProps: { name: "scoreMax" },
    scoreMinSliderProps: { name: "scoreMin" },
    tagFilterProps: {
      tags: [],
      selectedTags: [],
      tagAndFilter: false,
      onClickFilter: vi.fn(),
      onClickAll: vi.fn(),
      onClickClear: vi.fn(),
      onClickTag: vi.fn(),
    },
  }),
}));

import { CardListContainer } from "@src/features/card/containers/CardListContainer";

describe("CardListContainer", () => {
  const deck: Deck = {
    id: "deck-id",
    uid: "user-id",
    name: "Deck",
    isPublic: false,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    localMode: true,
    currentIndex: null,
    category: "raw",
    convertToBr: false,
    cardOrderIds: [],
    selectedTags: [],
    tagAndFilter: false,
    scoreMax: null,
    scoreMin: null,
  };
  const card: Card = {
    id: "card-id",
    deckId: deck.id,
    uid: "user-id",
    frontText: "FRONT TEXT",
    backText: "BACK TEXT",
    tags: [],
    uniqueKey: "unique-key",
    score: 0,
    numberOfSeen: 0,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
  };

  beforeEach(() => {
    mocks.params.id = deck.id;
    mocks.state = {
      deck: { byId: { [deck.id]: deck }, categories: [] },
      config: { darkMode: false, useCardInterval: false } as ConfigState,
      card: { byId: { [card.id]: card }, tags: [] },
    };
  });

  afterEach(() => {
    cleanup();
  });

  it("opens a selected card's back text and closes it through the overlay callback", async () => {
    const view = render(<CardListContainer />);

    expect(view.queryByText(card.backText)).not.toBeInTheDocument();

    await userEvent.click(view.getByText(card.frontText));
    expect(view.getByText(card.backText)).toBeVisible();

    await userEvent.click(view.getByText(card.backText));
    expect(view.queryByText(card.backText)).not.toBeInTheDocument();
  });
});
