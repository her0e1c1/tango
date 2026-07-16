import userEvent from "@testing-library/user-event";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  state: null as RootState | null,
  cardUpdateBy: vi.fn(),
  cardRemove: vi.fn(),
}));

vi.mock("@/features/card/hooks/useCardMutations", () => ({
  useCardMutations: () => ({
    updateBy: mocks.cardUpdateBy,
    remove: mocks.cardRemove,
    isPending: () => false,
    pending: false,
    error: null,
    retry: vi.fn(),
  }),
}));

vi.mock("react-redux", () => ({
  useSelector: (select: (state: RootState) => unknown) => {
    if (mocks.state == null) throw new Error("Mock state is not initialized");
    return select(mocks.state);
  },
}));

vi.mock("@/query/useRemoteCollections", () => ({
  useRemoteCollections: () => {
    const decks = mocks.state?.deck.byId ?? {};
    const cards = Object.values(mocks.state?.card.byId ?? {}).filter((card): card is Card => card != null);
    return {
      status: "ready" as const,
      retry: vi.fn(),
      deckById: (id: string) => decks[id],
      filteredCardsByDeckId: (id: string) => cards.filter((card) => card.deckId === id),
      tagsByDeckId: (id: string) => [
        ...new Set(cards.filter((card) => card.deckId === id).flatMap((card) => card.tags)),
      ],
    };
  },
}));

vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
}));

vi.mock("react-use", () => ({
  useKey: vi.fn(),
}));

vi.mock("@/shared/hooks/useActions", () => ({
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

vi.mock("@/features/deck/hooks/useDeckActions", () => ({
  useDeckActions: () => ({ update: vi.fn() }),
}));

vi.mock("@/features/deck/hooks/useDeckFilterState", () => ({
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

import { CardListContainer } from "@/features/card/containers/CardListContainer";

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

  it("renders a language card as code and closes it through the overlay callback", async () => {
    const languageCard = { ...card, tags: ["typescript"], backText: "const answer = 42;" };
    if (mocks.state == null) throw new Error("Mock state is not initialized");
    mocks.state = {
      ...mocks.state,
      card: { byId: { [languageCard.id]: languageCard }, tags: ["typescript"] },
    };
    const view = render(<CardListContainer />);

    await userEvent.click(view.getByText(languageCard.frontText));

    const code = view.container.querySelector("pre.typescript") as HTMLElement;
    expect(code).toHaveTextContent(languageCard.backText);

    await userEvent.click(code);
    expect(view.queryByText(languageCard.backText)).not.toBeInTheDocument();
  });
});
