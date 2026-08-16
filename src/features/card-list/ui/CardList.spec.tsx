import type { Card, CardId } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  deleteCard: vi.fn(),
  editStudyProgress: vi.fn(),
  deck: undefined as Deck | undefined,
  cards: [] as Card[],
  preferences: undefined as Preferences | undefined,
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({
  useAuthUid: () => "user-id",
}));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  deleteCard: mocks.deleteCard,
  useCardsByDeckId: () => ({
    cards: mocks.cards,
    tags: [...new Set(mocks.cards.flatMap((candidate) => candidate.tags))],
  }),
}));
vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  useDeck: () => mocks.deck,
}));
vi.mock("@/entities/preferences", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/preferences")>()),
  usePreferences: () => mocks.preferences,
}));
vi.mock("@/entities/study-progress", () => ({ editStudyProgress: mocks.editStudyProgress }));

import type * as React from "react";
import { useCardListState } from "../model/useCardListState";
import { CardList } from "./CardList";

interface CardListAnswer {
  text: string;
  category: string;
  code: boolean;
  dark: boolean;
}

const deck = createDeck({ id: "deck-id", category: "raw" });
const card = createCard({
  id: "card-id",
  deckId: deck.id,
  frontText: "Front",
  backText: "Back",
  score: 0,
  tags: [],
});
const onEditCard = vi.fn();
const onChangeSelectedTags = vi.fn();

interface CardListHarnessProps {
  deck: Deck;
  cards: Card[];
  preferences: Preferences;
  filter: {
    scoreMin: number | null;
    scoreMax: number | null;
    selectedTags: string[];
    controls: React.ReactNode;
    onRemoveTag: (tag: string) => void;
  };
  renderBackText: (answer: CardListAnswer) => React.ReactNode;
  onEditCard: (id: CardId) => void;
}

const CardListHarness = (props: CardListHarnessProps) => {
  const state = useCardListState(props.deck.id);

  if (state == null) return null;
  return (
    <CardList
      state={state}
      filter={props.filter}
      {...(state.answer !== undefined ? { answerSlot: props.renderBackText(state.answer) } : {})}
      onEditCard={props.onEditCard}
    />
  );
};

const defaultProps: CardListHarnessProps = {
  deck,
  cards: [card],
  preferences: createPreferences({ appearance: { darkMode: false } }),
  filter: {
    scoreMin: -2,
    scoreMax: 4,
    selectedTags: ["typescript", "react"],
    controls: <div>Filter controls</div>,
    onRemoveTag: onChangeSelectedTags,
  },
  renderBackText: (answer) => <div>{answer.text}</div>,
  onEditCard,
};

const renderCardList = (overrides: Partial<CardListHarnessProps> = {}) => {
  const props = { ...defaultProps, ...overrides };
  mocks.deck = props.deck;
  mocks.cards = props.cards;
  mocks.preferences = props.preferences;
  return render(<CardListHarness {...props} />);
};

const swipe = (article: HTMLElement, from: number, to: number) => {
  fireEvent.mouseDown(article, { clientX: from, clientY: 0 });
  fireEvent.mouseMove(document, { clientX: to, clientY: 0 });
  fireEvent.mouseUp(document, { clientX: to, clientY: 0 });
};

describe("CardList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteCard.mockResolvedValue(undefined);
    mocks.editStudyProgress.mockResolvedValue(undefined);
  });

  it("builds the list presentation and coordinates filter, view, and edit interactions", async () => {
    renderCardList();

    expect(screen.getByText("score -2–4 · 2 tags")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove typescript filter" }));
    expect(onChangeSelectedTags).toHaveBeenCalledExactlyOnceWith("typescript");

    await userEvent.click(screen.getByRole("button", { name: "View Front" }));
    expect(screen.getByText("Back")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Close card" }));
    expect(screen.queryByText("Back")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onEditCard).toHaveBeenCalledExactlyOnceWith(card.id);
  });

  it("renders a language card with the resolved back text presentation", async () => {
    const languageCard = createCard({
      ...card,
      backText: "const answer = 42;",
      tags: ["typescript"],
    });
    const renderBackText = vi.fn((backText: CardListAnswer) => <div>{backText.text}</div>);

    renderCardList({
      cards: [languageCard],
      preferences: createPreferences({ appearance: { darkMode: true } }),
      renderBackText,
    });

    await userEvent.click(screen.getByRole("button", { name: "View Front" }));

    expect(renderBackText).toHaveBeenCalledExactlyOnceWith({
      text: languageCard.backText,
      category: "typescript",
      code: true,
      dark: true,
    });
  });

  it("owns deletion confirmation and success feedback", async () => {
    renderCardList();
    const trigger = screen.getByRole("button", { name: "Open actions for Front" });

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("alertdialog", { name: "Delete card?" })).toHaveTextContent("Front");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete card" }));

    await waitFor(() => expect(mocks.deleteCard).toHaveBeenCalledExactlyOnceWith("user-id", card));
    expect(screen.getByText("Deleted card “Front”.")).toBeVisible();
  });

  it("keeps the deletion target available for retry after failure", async () => {
    mocks.deleteCard.mockRejectedValueOnce(new Error("delete failed"));
    renderCardList();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete card" }));

    expect(await screen.findByText("Unable to delete this card. Check your connection and try again.")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Delete card" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog", { name: "Delete card?" })).not.toBeInTheDocument());
  });

  it("keeps score mutation feedback retryable", async () => {
    mocks.editStudyProgress.mockRejectedValueOnce(new Error("edit failed"));
    renderCardList();
    const article = screen.getByRole("article");

    swipe(article, 0, 100);
    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    swipe(article, 0, 100);

    await waitFor(() => expect(screen.queryByText("Unable to save changes. Try again.")).not.toBeInTheDocument());
  });
});
