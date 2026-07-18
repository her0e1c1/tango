import userEvent from "@testing-library/user-event";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  config: { darkMode: false, useCardInterval: false } as ConfigState,
  deck: null as Deck | null,
  cards: [] as Card[],
  filter: { scoreMax: null as number | null, scoreMin: null as number | null, selectedTags: [] as string[] },
  pendingCardId: undefined as CardId | undefined,
  pending: false,
  error: null as unknown,
  retry: vi.fn(),
  goToCardEdit: vi.fn(),
  cardUpdateBy: vi.fn(),
  cardRemove: vi.fn(),
}));

vi.mock("@/features/card/hooks/useCardMutations", () => ({
  useCardMutations: () => ({
    updateBy: mocks.cardUpdateBy,
    remove: mocks.cardRemove,
    isPending: (id: CardId) => id === mocks.pendingCardId,
    pending: mocks.pending,
    error: mocks.error,
    retry: mocks.retry,
  }),
}));

vi.mock("@/features/settings/hooks/useConfig", () => ({ useConfig: () => mocks.config }));

vi.mock("@/query/useRemoteCollections", () => ({
  useRemoteCollections: () => {
    const cards = mocks.cards;
    return {
      status: "ready" as const,
      retry: vi.fn(),
      deckById: (id: string) => (mocks.deck?.id === id ? mocks.deck : undefined),
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

vi.mock("@/hooks/useActions", () => ({
  useActions: () => ({
    goToTop: vi.fn(),
    goToSettings: vi.fn(),
    goByMenu: vi.fn(),
    setDarkMode: vi.fn(),
    cardUpdateBy: vi.fn(() => vi.fn()),
    goToCardEdit: mocks.goToCardEdit,
    cardRemove: vi.fn(),
  }),
}));

vi.mock("@/features/deck/hooks/useDeckActions", () => ({
  useDeckActions: () => ({ update: vi.fn() }),
}));

vi.mock("@/features/deck/hooks/useDeckFilterState", () => ({
  useDeckFilterState: () => ({
    scoreMax: mocks.filter.scoreMax,
    scoreMin: mocks.filter.scoreMin,
    scoreMaxSwitchProps: { name: "scoreMaxSwitch" },
    scoreMinSwitchProps: { name: "scoreMinSwitch" },
    scoreMaxSliderProps: { name: "scoreMax" },
    scoreMinSliderProps: { name: "scoreMin" },
    tagFilterProps: {
      tags: [],
      selectedTags: mocks.filter.selectedTags,
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
    mocks.deck = deck;
    mocks.cards = [card];
    mocks.config = { darkMode: false, useCardInterval: false } as ConfigState;
    mocks.filter = { scoreMax: null, scoreMin: null, selectedTags: [] };
    mocks.pendingCardId = undefined;
    mocks.pending = false;
    mocks.error = null;
    mocks.retry.mockReset();
    mocks.goToCardEdit.mockReset();
    mocks.cardUpdateBy.mockReset().mockResolvedValue(undefined);
    mocks.cardRemove.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the current score and tag filters in the collapsed summary", () => {
    mocks.filter = { scoreMin: -2, scoreMax: 4, selectedTags: ["typescript"] };
    const view = render(<CardListContainer />);

    expect(view.getByRole("heading", { level: 1, name: "Cards" })).toBeInTheDocument();
    expect(view.getByText("1 card")).toBeInTheDocument();
    expect(view.getByText("score -2–4 · 1 tag")).toBeInTheDocument();
    expect(view.getByLabelText("Selected tags")).toHaveTextContent("typescript");
    expect(view.getByText("Filters").closest("details")).not.toHaveAttribute("open");
  });

  it("preserves Edit, Delete, and left/right swipe connections", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const view = render(<CardListContainer />);
    const trigger = view.getByRole("button", { name: `Open actions for ${card.frontText}` });

    await userEvent.click(trigger);
    await userEvent.click(view.getByRole("menuitem", { name: "Edit" }));
    expect(mocks.goToCardEdit).toHaveBeenCalledExactlyOnceWith(card.id);

    await userEvent.click(trigger);
    await userEvent.click(view.getByRole("menuitem", { name: "Delete" }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(mocks.cardRemove).toHaveBeenCalledExactlyOnceWith(card.id);

    confirm.mockReturnValue(false);
    await userEvent.click(trigger);
    await userEvent.click(view.getByRole("menuitem", { name: "Delete" }));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(mocks.cardRemove).toHaveBeenCalledOnce();

    const article = view.getByRole("article");
    fireEvent.mouseDown(article, { clientX: 100, clientY: 0 });
    fireEvent.mouseMove(document, { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(document, { clientX: 0, clientY: 0 });
    fireEvent.mouseDown(article, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(document, { clientX: 100, clientY: 0 });
    fireEvent.mouseUp(document, { clientX: 100, clientY: 0 });

    expect(mocks.cardUpdateBy).toHaveBeenCalledTimes(2);
    const decrement = mocks.cardUpdateBy.mock.calls[0]?.[1] as (value: Card) => Partial<Card>;
    const increment = mocks.cardUpdateBy.mock.calls[1]?.[1] as (value: Card) => Partial<Card>;
    expect(decrement(card)).toEqual({ score: -1 });
    expect(increment(card)).toEqual({ score: 1 });
  });

  it("forwards pending, error, and retry state", async () => {
    mocks.pending = true;
    mocks.pendingCardId = card.id;
    const view = render(<CardListContainer />);

    expect(view.getByText("Saving…").closest('[role="status"]')).toHaveTextContent("Saving…");
    expect(view.getByRole("button", { name: `View ${card.frontText}` })).toBeDisabled();
    expect(view.getByRole("button", { name: `Open actions for ${card.frontText}` })).toBeDisabled();

    mocks.pending = false;
    mocks.pendingCardId = undefined;
    mocks.error = new Error("write failed");
    view.rerender(<CardListContainer />);
    expect(view.getByRole("alert")).toHaveTextContent("Unable to save changes.");
    await userEvent.click(view.getByRole("button", { name: "Retry" }));
    expect(mocks.retry).toHaveBeenCalledOnce();
  });

  it("opens a selected card's back text and closes it through the overlay callback", async () => {
    const view = render(<CardListContainer />);

    expect(view.queryByText(card.backText)).not.toBeInTheDocument();

    await userEvent.click(view.getByRole("button", { name: `View ${card.frontText}` }));
    expect(view.getByText(card.backText)).toBeVisible();

    await userEvent.click(view.getByText(card.backText));
    expect(view.queryByText(card.backText)).not.toBeInTheDocument();
  });

  it("renders a language card as code and closes it through the overlay callback", async () => {
    const languageCard = { ...card, tags: ["typescript"], backText: "const answer = 42;" };
    mocks.cards = [languageCard];
    const view = render(<CardListContainer />);

    await userEvent.click(view.getByRole("button", { name: `View ${languageCard.frontText}` }));

    const code = view.container.querySelector("pre.typescript") as HTMLElement;
    expect(code).toHaveTextContent(languageCard.backText);

    await userEvent.click(code);
    expect(view.queryByText(languageCard.backText)).not.toBeInTheDocument();
  });
});
