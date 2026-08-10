/**
 * @file Verifies the "CardListPage" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders the current score
 * and tag filters in the collapsed summary", "removes one selected tag through the existing filter
 * callback", and "cancels or confirms Card deletion with observable feedback".
 */
import type { ConfigState } from "@/entities/config";
import type { Deck } from "@/entities/deck";
import type { Card, CardId } from "@/entities/card";

import userEvent from "@testing-library/user-event";
import { cleanup, render } from "@testing-library/react";
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
  onClickTag: vi.fn(),
  navigate: vi.fn(),
  onRemoveSuccess: undefined as ((card: Card) => void) | undefined,
}));

vi.mock("@/features/card", async () => {
  const [{ BackText }, { Card }] = await Promise.all([
    vi.importActual<typeof import("@/features/card/components/BackText")>("@/features/card/components/BackText"),
    vi.importActual<typeof import("@/features/card/components/Card")>("@/features/card/components/Card"),
  ]);
  return {
    BackText,
    Card,
    useCardMutations: (options?: { onRemoveSuccess?: (card: Card) => void }) => ({
      updateBy: mocks.cardUpdateBy,
      remove: (id: CardId) => {
        mocks.onRemoveSuccess = options?.onRemoveSuccess;
        return mocks.cardRemove(id).then(() => {
          const card = mocks.cards.find((candidate) => candidate.id === id);
          if (card != null) mocks.onRemoveSuccess?.(card);
        });
      },
      isPending: (id: CardId) => id === mocks.pendingCardId,
      pending: mocks.pending,
      error: mocks.error,
      retry: mocks.retry,
    }),
  };
});

vi.mock("@/entities/config", () => ({ useConfig: () => mocks.config }));

vi.mock("@/features/remote-collections", () => ({
  useRemoteCollections: () => {
    const cards = mocks.cards;
    return {
      status: "ready" as const,
      retry: vi.fn(),
      deckById: (id: string) => (mocks.deck?.id === id ? mocks.deck : undefined),
      cardsByDeckId: (id: string) => cards.filter((card) => card.deckId === id),
      now: 0,
      tagsByDeckId: (id: string) => [
        ...new Set(cards.filter((card) => card.deckId === id).flatMap((card) => card.tags)),
      ],
    };
  },
}));

vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
  useNavigate: () => mocks.navigate,
}));

vi.mock("react-use", () => ({
  useKey: vi.fn(),
}));

vi.mock("@/features/app-controls", () => ({
  useActions: () => ({
    goToTop: vi.fn(),
    goToSettings: vi.fn(),
    goToImport: vi.fn(),
    setDarkMode: vi.fn(),
    cardUpdateBy: vi.fn(() => vi.fn()),
    goToCardEdit: mocks.goToCardEdit,
    cardRemove: vi.fn(),
  }),
}));

vi.mock("@/features/deck", async () => {
  const { DeckStartForm } = await vi.importActual<typeof import("@/features/deck/components/DeckStartForm")>(
    "@/features/deck/components/DeckStartForm"
  );
  return {
    DeckStartForm,
    useDeckActions: () => ({ update: vi.fn() }),
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
        onClickTag: mocks.onClickTag,
      },
    }),
  };
});

import { CardListPage } from "./CardListPage";

describe("CardListPage", () => {
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
    mocks.onClickTag.mockReset();
    mocks.navigate.mockReset();
    mocks.onRemoveSuccess = undefined;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the current score and tag filters in the collapsed summary", () => {
    mocks.filter = { scoreMin: -2, scoreMax: 4, selectedTags: ["typescript"] };
    const view = render(<CardListPage />);

    expect(view.getByRole("heading", { level: 1, name: "Cards" })).toBeInTheDocument();
    expect(view.getByText("1 card")).toBeInTheDocument();
    expect(view.getByText("score -2–4 · 1 tag")).toBeInTheDocument();
    expect(view.getByLabelText("Selected tags")).toHaveTextContent("typescript");
    expect(view.getByText("Filters").closest("details")).not.toHaveAttribute("open");
  });

  it("removes one selected tag through the existing filter callback", async () => {
    mocks.filter = { scoreMin: null, scoreMax: null, selectedTags: ["typescript", "react"] };
    const view = render(<CardListPage />);

    await userEvent.click(view.getByRole("button", { name: "Remove typescript filter" }));
    expect(mocks.onClickTag).toHaveBeenCalledExactlyOnceWith(["react"]);
  });

  it("cancels or confirms Card deletion with observable feedback", async () => {
    const view = render(<CardListPage />);
    const trigger = view.getByRole("button", { name: `Open actions for ${card.frontText}` });

    await userEvent.click(trigger);
    await userEvent.click(view.getByRole("menuitem", { name: "Delete" }));
    const dialog = view.getByRole("alertdialog", { name: "Delete card?" });
    expect(dialog).toHaveTextContent(card.frontText);
    expect(dialog).toHaveTextContent("cannot be undone");

    await userEvent.click(view.getByRole("button", { name: "Cancel" }));
    expect(view.queryByRole("alertdialog", { name: "Delete card?" })).not.toBeInTheDocument();
    expect(view.queryByText(`Deleted card “${card.frontText}”.`)).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.click(view.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(view.getByRole("button", { name: "Delete card" }));

    expect(view.queryByRole("alertdialog", { name: "Delete card?" })).not.toBeInTheDocument();
    expect(view.getByText(`Deleted card “${card.frontText}”.`).closest('[role="status"]')).toBeInTheDocument();
  });

  it("forwards pending, error, and retry state", async () => {
    mocks.pending = true;
    mocks.pendingCardId = card.id;
    const view = render(<CardListPage />);

    expect(view.getByText("Saving…").closest('[role="status"]')).toHaveTextContent("Saving…");
    expect(view.getByRole("button", { name: `View ${card.frontText}` })).toBeDisabled();
    expect(view.getByRole("button", { name: `Open actions for ${card.frontText}` })).toBeDisabled();

    mocks.pending = false;
    mocks.pendingCardId = undefined;
    mocks.error = new Error("write failed");
    view.rerender(<CardListPage />);
    expect(view.getByRole("alert")).toHaveTextContent("Unable to save changes.");
    await userEvent.click(view.getByRole("button", { name: "Retry" }));
    expect(mocks.retry).toHaveBeenCalledOnce();
  });

  it("keeps a failed Card deletion explainable and retryable", async () => {
    mocks.cardRemove.mockRejectedValueOnce(new Error("delete failed"));
    const view = render(<CardListPage />);

    await userEvent.click(view.getByRole("button", { name: `Open actions for ${card.frontText}` }));
    await userEvent.click(view.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(view.getByRole("button", { name: "Delete card" }));

    expect(view.getByRole("alertdialog", { name: "Delete card?" })).toBeInTheDocument();
    expect(view.getByText("Unable to delete this card. Check your connection and try again.")).toBeInTheDocument();
    mocks.error = new Error("delete failed");
    view.rerender(<CardListPage />);
    await userEvent.click(view.getByRole("button", { name: "Retry" }));
    expect(mocks.retry).toHaveBeenCalledOnce();
  });

  it("opens a selected card's back text and closes it through the overlay callback", async () => {
    const view = render(<CardListPage />);

    expect(view.queryByText(card.backText)).not.toBeInTheDocument();

    await userEvent.click(view.getByRole("button", { name: `View ${card.frontText}` }));
    expect(view.getByText(card.backText)).toBeVisible();

    await userEvent.click(view.getByText(card.backText));
    expect(view.queryByText(card.backText)).not.toBeInTheDocument();
  });

  it("renders a language card as code and closes it through the overlay callback", async () => {
    const languageCard = { ...card, tags: ["typescript"], backText: "const answer = 42;" };
    mocks.cards = [languageCard];
    const view = render(<CardListPage />);

    await userEvent.click(view.getByRole("button", { name: `View ${languageCard.frontText}` }));

    const code = view.container.querySelector("pre.typescript") as HTMLElement;
    expect(code).toHaveTextContent(languageCard.backText);

    await userEvent.click(code);
    expect(view.queryByText(languageCard.backText)).not.toBeInTheDocument();
  });
});
