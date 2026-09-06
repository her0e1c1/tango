import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";
import { createCard, createDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  deleteCard: vi.fn(),
  editDeck: vi.fn(),
  editStudyProgress: vi.fn(),
  deck: undefined as Deck | undefined,
  cards: [] as Card[],
  preferences: undefined as Preferences | undefined,
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
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
  editDeck: mocks.editDeck,
  useDeck: () => mocks.deck,
}));
vi.mock("@/entities/preference", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/preference")>()),
  usePreferences: () => mocks.preferences,
}));
vi.mock("@/entities/study-progress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/study-progress")>()),
  editStudyProgress: mocks.editStudyProgress,
}));

import { CardListPage } from "./CardListPage";

const deck = createDeck({
  id: "deck-id",
  category: "raw",
  difficultyMin: 3,
  difficultyMax: 4,
  selectedTags: ["typescript", "react"],
});
const card = createCard({
  id: "card-id",
  deckId: deck.id,
  frontText: "Front",
  backText: "Back",
  difficulty: 4,
  tags: ["typescript", "react"],
});

interface RenderCardListOptions {
  deck: Deck;
  cards: Card[];
  preferences: Preferences;
}

const defaultOptions: RenderCardListOptions = {
  deck,
  cards: [card],
  preferences: createPreferences({ appearance: { darkMode: false } }),
};

const createCardListPage = (deckId: string) => (
  <>
    <MemoryRouter initialEntries={[`/deck/${deckId}`]}>
      <Routes>
        <Route path="/" element={<h1>Deck list destination</h1>} />
        <Route path="/settings" element={<h1>Settings destination</h1>} />
        <Route path="/deck/:id" element={<CardListPage />} />
        <Route path="/card/:id/edit" element={<h1>Card editor destination</h1>} />
      </Routes>
    </MemoryRouter>
    <ToastViewport />
  </>
);

const renderCardList = (overrides: Partial<RenderCardListOptions> = {}) => {
  const options = { ...defaultOptions, ...overrides };
  mocks.deck = options.deck;
  mocks.cards = options.cards;
  mocks.preferences = options.preferences;

  return render(createCardListPage(options.deck.id));
};

const swipeRight = (article: HTMLElement) => {
  fireEvent.mouseDown(article, { clientX: 0, clientY: 0 });
  fireEvent.mouseMove(document, { clientX: 100, clientY: 0 });
  fireEvent.mouseUp(document, { clientX: 100, clientY: 0 });
};

describe("CARD-02 CARD-04 CARD-05 CARD-06 CARD-10 CARD-16 CARD-18 CARD-19 CARD-20 CardListPage interactions", () => {
  beforeEach(() => {
    dismissToast();
    vi.clearAllMocks();
    mocks.deleteCard.mockResolvedValue(undefined);
    mocks.editDeck.mockResolvedValue(undefined);
    mocks.editStudyProgress.mockResolvedValue(undefined);
  });

  it("updates filters and automatically persists the complete selection", async () => {
    renderCardList();

    await userEvent.click(screen.getByRole("button", { name: "Remove typescript filter" }));
    expect(screen.getByText("difficulty 3–4 · 1 tag")).toBeVisible();

    expect(mocks.editDeck).toHaveBeenCalledExactlyOnceWith("user-id", {
      id: deck.id,
      difficultyMax: 4,
      difficultyMin: 3,
      selectedTags: ["react"],
      tagAndFilter: false,
    });
  });

  it("does not report the full difficulty domain as an active filter", () => {
    const fullRangeDeck = createDeck({
      ...deck,
      difficultyMin: 1,
      difficultyMax: 10,
      selectedTags: [],
    });
    const view = renderCardList({ deck: fullRangeDeck });

    expect(screen.getByText("No filters")).toBeInTheDocument();
    expect(screen.queryByText("difficulty 1–10")).not.toBeInTheDocument();

    view.unmount();
    renderCardList({ deck: { ...fullRangeDeck, selectedTags: ["typescript"] } });
    expect(screen.getByText("1 tag")).toBeInTheDocument();
    expect(screen.queryByText("difficulty 1–10")).not.toBeInTheDocument();
  });

  it("coordinates Card view and edit navigation", async () => {
    renderCardList();

    await userEvent.click(screen.getByRole("button", { name: "View Front" }));
    expect(screen.getByText("Back")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Close card" }));

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Card editor destination" })).toBeVisible();
  });

  it("renders a language Card answer in the overlay", async () => {
    const languageCard = createCard({ ...card, backText: "const answer = 42;", tags: ["typescript"] });
    renderCardList({
      deck: { ...deck, selectedTags: ["typescript"] },
      cards: [languageCard],
      preferences: createPreferences({ appearance: { darkMode: true } }),
    });

    await userEvent.click(screen.getByRole("button", { name: "View Front" }));

    expect(screen.getByLabelText("Close card")).toHaveTextContent(languageCard.backText);
  });

  it("sets the requested difficulty only on the Cards visible when confirmation opens", async () => {
    const otherVisibleCard = createCard({
      id: "other-visible-card",
      deckId: deck.id,
      frontText: "Other visible",
      difficulty: 4,
      tags: ["react"],
    });
    const hiddenCard = createCard({
      id: "hidden-card",
      deckId: deck.id,
      frontText: "Hidden",
      difficulty: 6,
      tags: ["react"],
    });
    const view = renderCardList({ cards: [card, otherVisibleCard, hiddenCard] });

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "New difficulty" }), "7");
    await userEvent.click(screen.getByRole("button", { name: "Change difficulty" }));
    const dialog = screen.getByRole("dialog", { name: "Change card difficulty?" });
    expect(dialog).toHaveTextContent("Set 2 visible cards to difficulty 7.");
    expect(mocks.editStudyProgress).not.toHaveBeenCalled();

    mocks.cards = [card, hiddenCard];
    view.rerender(createCardListPage(deck.id));
    expect(screen.getByText("1 card")).toBeVisible();
    expect(dialog).toHaveTextContent("Set 2 visible cards to difficulty 7.");

    await userEvent.click(within(dialog).getByRole("button", { name: "Apply change" }));

    await waitFor(() => expect(mocks.editStudyProgress).toHaveBeenCalledTimes(2));
    expect(mocks.editStudyProgress).toHaveBeenCalledWith("user-id", { cardId: card.id, difficulty: 7 });
    expect(mocks.editStudyProgress).toHaveBeenCalledWith("user-id", {
      cardId: otherVisibleCard.id,
      difficulty: 7,
    });
    expect(mocks.editStudyProgress).not.toHaveBeenCalledWith("user-id", {
      cardId: hiddenCard.id,
      difficulty: 7,
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Change card difficulty?" })).not.toBeInTheDocument()
    );
    expect(screen.getByRole("combobox", { name: "New difficulty" })).toHaveValue("");
    expect(screen.getByText("Set 2 cards to difficulty 7.")).toBeVisible();
  });

  it("waits for every bulk write and retains the confirmed snapshot for an idempotent retry", async () => {
    const otherVisibleCard = createCard({
      id: "other-visible-card",
      deckId: deck.id,
      frontText: "Other visible",
      difficulty: 4,
      tags: ["react"],
    });
    const remainingWrite = Promise.withResolvers<void>();
    mocks.editStudyProgress.mockRejectedValueOnce(new Error("first bulk write failed"));
    mocks.editStudyProgress.mockReturnValueOnce(remainingWrite.promise);
    renderCardList({ cards: [card, otherVisibleCard] });

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "New difficulty" }), "7");
    await userEvent.click(screen.getByRole("button", { name: "Change difficulty" }));
    const dialog = screen.getByRole("dialog", { name: "Change card difficulty?" });
    const confirm = within(dialog).getByRole("button", { name: "Apply change" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    await waitFor(() => expect(mocks.editStudyProgress).toHaveBeenCalledTimes(2));
    expect(dialog).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText(/could not be updated/)).not.toBeInTheDocument();

    await actAsync(async () => {
      remainingWrite.resolve();
      await remainingWrite.promise;
    });

    expect(await screen.findByText("Updated 1 of 2. 1 card could not be updated. Try again.")).toBeVisible();
    expect(screen.getByRole("dialog", { name: "Change card difficulty?" })).toHaveTextContent(
      "Set 2 visible cards to difficulty 7."
    );
    expect(screen.getByRole("combobox", { name: "New difficulty" })).toHaveValue("7");

    await userEvent.click(screen.getByRole("button", { name: "Apply change" }));

    await waitFor(() => expect(mocks.editStudyProgress).toHaveBeenCalledTimes(4));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Change card difficulty?" })).not.toBeInTheDocument()
    );
    expect(screen.queryByText(/could not be updated/)).not.toBeInTheDocument();
    expect(screen.getByText("Set 2 cards to difficulty 7.")).toBeVisible();
  });

  it("uses singular failure copy when the only bulk write fails", async () => {
    mocks.editStudyProgress.mockRejectedValueOnce(new Error("bulk write failed"));
    renderCardList();

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "New difficulty" }), "7");
    await userEvent.click(screen.getByRole("button", { name: "Change difficulty" }));
    await userEvent.click(screen.getByRole("button", { name: "Apply change" }));

    expect(await screen.findByText("Updated 0 of 1. 1 card could not be updated. Try again.")).toBeVisible();
  });

  it("ignores screen shortcuts while bulk confirmation is open or pending", async () => {
    const write = Promise.withResolvers<void>();
    mocks.editStudyProgress.mockReturnValueOnce(write.promise);
    renderCardList();

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "New difficulty" }), "7");
    await userEvent.click(screen.getByRole("button", { name: "Change difficulty" }));
    const dialog = screen.getByRole("dialog", { name: "Change card difficulty?" });

    fireEvent.keyDown(window, { key: "s" });
    fireEvent.keyDown(window, { key: "t" });
    expect(dialog).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Settings destination" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Deck list destination" })).not.toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: "Apply change" }));
    await waitFor(() => expect(dialog).toHaveAttribute("aria-busy", "true"));
    fireEvent.keyDown(window, { key: "s" });
    fireEvent.keyDown(window, { key: "t" });
    expect(dialog).toBeVisible();

    await actAsync(async () => {
      write.resolve();
      await write.promise;
    });
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it("closes a failed deletion and retries after reopening the same Card", async () => {
    mocks.deleteCard.mockRejectedValueOnce(new Error("delete failed"));
    renderCardList();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete card" }));

    expect(await screen.findByText("Unable to delete this card. Check your connection and try again.")).toBeVisible();
    expect(screen.queryByRole("alertdialog", { name: "Delete card?" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete card" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog", { name: "Delete card?" })).not.toBeInTheDocument());
    expect(mocks.deleteCard).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Deleted card “Front”.")).toBeVisible();
  });

  it("allows only one list mutation until the active write settles", async () => {
    const difficultyWrite = Promise.withResolvers<void>();
    mocks.editStudyProgress.mockReturnValueOnce(difficultyWrite.promise);
    renderCardList();
    await userEvent.click(screen.getByRole("button", { name: "Remove typescript filter" }));
    const article = screen.getByRole("article");

    swipeRight(article);

    await waitFor(() => expect(mocks.editStudyProgress).toHaveBeenCalledOnce());
    expect(screen.getByRole("button", { name: "Add card" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toBeDisabled();
    expect(within(article).getByRole("button", { name: "View Front" })).toBeDisabled();
    swipeRight(article);
    expect(mocks.editStudyProgress).toHaveBeenCalledOnce();

    await actAsync(async () => {
      difficultyWrite.resolve();
      await difficultyWrite.promise;
    });
    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toBeEnabled();
  });

  it("retries a failed difficulty write through the same swipe gesture", async () => {
    mocks.editStudyProgress.mockRejectedValueOnce(new Error("edit failed"));
    renderCardList();
    const article = screen.getByRole("article");

    swipeRight(article);
    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    swipeRight(article);

    await waitFor(() => expect(mocks.editStudyProgress).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("Unable to save changes. Try again.")).not.toBeInTheDocument();
    expect(mocks.editStudyProgress).toHaveBeenLastCalledWith("user-id", {
      cardId: card.id,
      difficulty: 3,
    });
  });
});
