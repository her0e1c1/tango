import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";
import type { StudyProgress } from "@/entities/study-progress";

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
  updateScore: vi.fn(),
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
vi.mock("@/entities/deck", () => ({ useDeck: () => mocks.deck ?? undefined }));
vi.mock("@/features/card-list", () => ({
  useEditCardScore: () => ({ updateScore: mocks.updateScore }),
  CardList: (props: {
    cards: { card: Card; progress: StudyProgress }[];
    filter: { selectedTags: string[]; onChangeSelectedTags: (tags: string[]) => void };
    onEditCard: (id: string) => void;
    onChangeScore: (progress: StudyProgress, score: number) => Promise<void>;
  }) => {
    mocks.cardListProps = props as unknown as Record<string, unknown>;
    return (
      <div>
        <span>Card list feature</span>
        <button type="button" onClick={() => props.onEditCard(props.cards[0]?.card.id ?? "missing")}>
          Edit card
        </button>
        <button
          type="button"
          onClick={() => {
            const progress = props.cards[0]?.progress;
            if (progress !== undefined) void props.onChangeScore(progress, 3);
          }}
        >
          Change score
        </button>
        <button type="button" onClick={() => props.filter.onChangeSelectedTags(["react"])}>
          Change tags
        </button>
      </div>
    );
  },
}));
vi.mock("@/features/deck-start", () => ({
  DeckStartForm: () => <div>Filter controls</div>,
  useStudyCards: (deck: Deck | undefined, cards: Card[]) =>
    deck == null ? [] : cards.map((card) => ({ card, progress: { cardId: card.id, score: 0, numberOfSeen: 0 } })),
  useDeckFilterState: () => ({
    scoreMax: 4,
    scoreMin: -2,
    tagFilterProps: { selectedTags: ["typescript"], onClickTag: mocks.onClickTag },
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
    mocks.updateScore.mockReset().mockResolvedValue(undefined);
    mocks.cardListProps = null;
  });

  it("composes the feature from the resolved route data and route callbacks", async () => {
    render(<CardListPage />);

    expect(screen.getByText("Card list feature")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Edit card" }));
    expect(mocks.navigate).toHaveBeenCalledWith(`/card/${card.id}/edit`);

    await userEvent.click(screen.getByRole("button", { name: "Change score" }));
    expect(mocks.updateScore).toHaveBeenCalledExactlyOnceWith(card.id, 3);

    await userEvent.click(screen.getByRole("button", { name: "Change tags" }));
    expect(mocks.onClickTag).toHaveBeenCalledExactlyOnceWith(["react"]);
  });

  it("keeps route shortcuts in the page adapter", () => {
    render(<CardListPage />);

    fireEvent.keyDown(window, { key: "t" });
    fireEvent.keyDown(window, { key: "s" });
    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/");
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, "/settings");
  });

  it("renders not-found feedback with route navigation", async () => {
    mocks.deck = null;
    render(<CardListPage />);

    expect(screen.getByRole("heading", { name: "Deck not found" })).toBeInTheDocument();
    expect(screen.queryByText("Card list feature")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/");
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, -1);
  });
});
