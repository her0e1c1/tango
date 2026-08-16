import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  preferences: null as unknown as Preferences,
  deck: null as Deck | null,
  cards: [] as Card[],
  navigate: vi.fn(),
  onClickTag: vi.fn(),
  cardListProps: null as null | Record<string, unknown>,
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));
vi.mock("@/entities/preferences", () => ({ usePreferences: () => mocks.preferences, setDarkMode: vi.fn() }));
vi.mock("@/entities/card", () => ({
  useCardsByDeckId: (id: string) => {
    const cards = mocks.cards.filter((card) => card.deckId === id);
    return { cards, tags: [...new Set(cards.flatMap((card) => card.tags))] };
  },
}));
vi.mock("@/entities/deck", () => ({
  filterCardsForDeck: (cards: Card[]) => cards,
  useDeck: () => mocks.deck ?? undefined,
}));
vi.mock("@/features/card-list", () => ({
  useCardListState: ({ cards }: { cards: Card[] }) => ({
    cards,
    answer: undefined,
    deletionTarget: undefined,
    mutationError: null,
    successMessage: undefined,
    onShowCard: vi.fn(),
    onCloseCard: vi.fn(),
    onSwipedLeft: vi.fn(),
    onSwipedRight: vi.fn(),
    onRequestDeletion: vi.fn(),
    onCancelDeletion: vi.fn(),
    onConfirmDeletion: vi.fn(),
  }),
  CardList: (props: {
    state: { cards: Card[] };
    filter: { selectedTags: string[]; onRemoveTag: (tag: string) => void };
    onEditCard: (id: string) => void;
  }) => {
    mocks.cardListProps = props as unknown as Record<string, unknown>;
    return (
      <div>
        <span>Card list feature</span>
        <button type="button" onClick={() => props.onEditCard(props.state.cards[0]?.id ?? "missing")}>
          Edit card
        </button>
        <button type="button" onClick={() => props.filter.onRemoveTag("typescript")}>
          Change tags
        </button>
      </div>
    );
  },
}));
vi.mock("@/features/deck-filter", () => ({
  DeckFilterForm: () => <div>Filter controls</div>,
  useDeckFilterState: () => ({
    scoreMax: 4,
    scoreMin: -2,
    selectedTags: ["typescript"],
    tagAndFilter: false,
    setScoreMax: vi.fn(),
    setScoreMin: vi.fn(),
    setSelectedTags: mocks.onClickTag,
    setTagAndFilter: vi.fn(),
  }),
}));
vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
  useNavigate: () => mocks.navigate,
}));

import { CardListPage } from "./CardListPage";

describe("CardListPage", () => {
  const deck = createDeck({ id: "deck-id" });
  const card = createCard({ id: "card-id", deckId: deck.id, tags: ["typescript"] });
  const otherCard = createCard({ id: "other-card", deckId: "other-deck" });

  beforeEach(() => {
    mocks.params.id = deck.id;
    mocks.deck = deck;
    mocks.cards = [card, otherCard];
    mocks.preferences = createPreferences();
    mocks.navigate.mockReset();
    mocks.onClickTag.mockReset();
    mocks.cardListProps = null;
  });

  it("composes the feature from the resolved route data and route callbacks", async () => {
    render(<CardListPage />);

    expect(screen.getByText("Card list feature")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Edit card" }));
    expect(mocks.navigate).toHaveBeenCalledWith(`/card/${card.id}/edit`, undefined);

    await userEvent.click(screen.getByRole("button", { name: "Change tags" }));
    expect(mocks.onClickTag).toHaveBeenCalledExactlyOnceWith([]);
  });

  it("keeps route shortcuts in the page adapter", () => {
    render(<CardListPage />);

    fireEvent.keyDown(window, { key: "t" });
    fireEvent.keyDown(window, { key: "s" });
    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/", undefined);
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, "/settings", undefined);
  });

  it("renders not-found feedback with route navigation", async () => {
    mocks.deck = null;
    render(<CardListPage />);

    expect(screen.getByRole("heading", { name: "Deck not found" })).toBeInTheDocument();
    expect(screen.queryByText("Card list feature")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/", undefined);
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, -1);
  });
});
