import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";
import type { ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  deckCards: [] as Card[],
  filteredCards: [] as Card[],
  tags: [] as string[],
  requestedDeckId: undefined as string | undefined,
  filterOptions: undefined as { deck: Deck; tags: string[] } | undefined,
  onClickTag: vi.fn(),
  updateScore: vi.fn(),
}));

vi.mock("@/entities/preferences", () => ({ usePreferences: () => mocks.preferences }));
vi.mock("@/entities/card", () => ({
  useCardsByDeckId: (deckId: string) => {
    mocks.requestedDeckId = deckId;
    return { cards: mocks.deckCards, tags: mocks.tags };
  },
}));
vi.mock("@/features/deck-filter", () => ({
  DeckFilterForm: () => <div>Filter controls</div>,
  useFilteredStudyCards: () => mocks.filteredCards,
  useDeckFilterState: (options: { deck: Deck; tags: string[] }) => {
    mocks.filterOptions = options;
    return {
      scoreMax: 4,
      scoreMin: -2,
      tagFilterProps: { selectedTags: ["typescript"], onClickTag: mocks.onClickTag },
    };
  },
}));
vi.mock("../model/useEditCardScore", () => ({
  useEditCardScore: () => ({ updateScore: mocks.updateScore }),
}));
vi.mock("./CardList", () => ({
  CardList: (props: {
    cards: Card[];
    preferences: Preferences;
    filter: {
      scoreMax: number;
      scoreMin: number;
      selectedTags: string[];
      controls: ReactNode;
      onChangeSelectedTags: (tags: string[]) => void;
    };
    renderBackText: (props: { text: string }) => ReactNode;
    onEditCard: (id: string) => void;
    onChangeScore: (card: Card, score: number) => Promise<void>;
  }) => (
    <section>
      <div>{props.filter.controls}</div>
      <span>{props.cards.map((card) => card.id).join(",")}</span>
      <span>{`${props.filter.scoreMin}:${props.filter.scoreMax}:${props.filter.selectedTags.join(",")}`}</span>
      <span>{String(props.preferences.appearance.darkMode)}</span>
      {props.renderBackText({ text: "Back text" })}
      <button type="button" onClick={() => props.onEditCard(props.cards[0]?.id ?? "missing")}>
        Edit card
      </button>
      <button type="button" onClick={() => void props.onChangeScore(props.cards[0] as Card, 3)}>
        Change score
      </button>
      <button type="button" onClick={() => props.filter.onChangeSelectedTags(["react"])}>
        Change tags
      </button>
    </section>
  ),
}));

import { CardListContainer } from "./CardListContainer";

describe("CardListContainer", () => {
  const deck = createDeck({ id: "deck-id" });
  const deckCard = createCard({ id: "deck-card", deckId: deck.id });
  const filteredCard = createCard({ id: "filtered-card", deckId: deck.id });
  const onEditCard = vi.fn();
  const renderBackText = ({ text }: { text: string }) => <div>{text}</div>;

  beforeEach(() => {
    mocks.preferences = createPreferences({ appearance: { darkMode: true } });
    mocks.deckCards = [deckCard];
    mocks.filteredCards = [filteredCard];
    mocks.tags = ["typescript"];
    mocks.requestedDeckId = undefined;
    mocks.filterOptions = undefined;
    vi.clearAllMocks();
    mocks.updateScore.mockResolvedValue(undefined);
  });

  it("coordinates card data, filtering, and presentation state", () => {
    render(<CardListContainer deck={deck} renderBackText={renderBackText} onEditCard={onEditCard} />);

    expect(mocks.requestedDeckId).toBe(deck.id);
    expect(mocks.filterOptions).toEqual({ deck, tags: ["typescript"] });
    expect(screen.getByText("Filter controls")).toBeVisible();
    expect(screen.getByText(filteredCard.id)).toBeVisible();
    expect(screen.getByText("-2:4:typescript")).toBeVisible();
    expect(screen.getByText("true")).toBeVisible();
    expect(screen.getByText("Back text")).toBeVisible();
  });

  it("connects edit, score, and filter actions", async () => {
    render(<CardListContainer deck={deck} renderBackText={renderBackText} onEditCard={onEditCard} />);

    await userEvent.click(screen.getByRole("button", { name: "Edit card" }));
    await userEvent.click(screen.getByRole("button", { name: "Change score" }));
    await userEvent.click(screen.getByRole("button", { name: "Change tags" }));

    expect(onEditCard).toHaveBeenCalledExactlyOnceWith(filteredCard.id);
    expect(mocks.updateScore).toHaveBeenCalledExactlyOnceWith(filteredCard.id, 3);
    expect(mocks.onClickTag).toHaveBeenCalledExactlyOnceWith(["react"]);
  });
});
