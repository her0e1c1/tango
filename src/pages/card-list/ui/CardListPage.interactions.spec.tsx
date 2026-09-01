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
  scoreMin: -2,
  scoreMax: 4,
  selectedTags: ["typescript", "react"],
});
const card = createCard({
  id: "card-id",
  deckId: deck.id,
  frontText: "Front",
  backText: "Back",
  score: 0,
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

const renderCardList = (overrides: Partial<RenderCardListOptions> = {}) => {
  const options = { ...defaultOptions, ...overrides };
  mocks.deck = options.deck;
  mocks.cards = options.cards;
  mocks.preferences = options.preferences;

  return render(
    <>
      <MemoryRouter initialEntries={[`/deck/${options.deck.id}`]}>
        <Routes>
          <Route path="/deck/:id" element={<CardListPage />} />
          <Route path="/card/:id/edit" element={<h1>Card editor destination</h1>} />
        </Routes>
      </MemoryRouter>
      <ToastViewport />
    </>
  );
};

const swipeRight = (article: HTMLElement) => {
  fireEvent.mouseDown(article, { clientX: 0, clientY: 0 });
  fireEvent.mouseMove(document, { clientX: 100, clientY: 0 });
  fireEvent.mouseUp(document, { clientX: 100, clientY: 0 });
};

describe("CARD-02 CARD-04 CARD-10 CARD-16 CARD-18 CardListPage interactions", () => {
  beforeEach(() => {
    dismissToast();
    vi.clearAllMocks();
    mocks.deleteCard.mockResolvedValue(undefined);
    mocks.editDeck.mockResolvedValue(undefined);
    mocks.editStudyProgress.mockResolvedValue(undefined);
  });

  it("previews filters and persists the complete draft only from Save filters", async () => {
    renderCardList();

    await userEvent.click(screen.getByRole("button", { name: "Remove typescript filter" }));
    expect(screen.getByText("score -2–4 · 1 tag")).toBeVisible();
    expect(mocks.editDeck).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Save filters" }));

    expect(mocks.editDeck).toHaveBeenCalledExactlyOnceWith("user-id", {
      id: deck.id,
      scoreMax: 4,
      scoreMin: -2,
      selectedTags: ["react"],
      tagAndFilter: false,
    });
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
    const scoreWrite = Promise.withResolvers<void>();
    mocks.editStudyProgress.mockReturnValueOnce(scoreWrite.promise);
    renderCardList();
    await userEvent.click(screen.getByRole("button", { name: "Remove typescript filter" }));
    const article = screen.getByRole("article");

    swipeRight(article);

    await waitFor(() => expect(mocks.editStudyProgress).toHaveBeenCalledOnce());
    expect(screen.getByRole("button", { name: "Add card" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save filters" })).toBeDisabled();
    expect(within(article).getByRole("button", { name: "View Front" })).toBeDisabled();
    swipeRight(article);
    expect(mocks.editStudyProgress).toHaveBeenCalledOnce();

    await actAsync(async () => {
      scoreWrite.resolve();
      await scoreWrite.promise;
    });
    expect(screen.getByRole("button", { name: "Save filters" })).toBeEnabled();
  });

  it("retries a failed score write through the same swipe gesture", async () => {
    mocks.editStudyProgress.mockRejectedValueOnce(new Error("edit failed"));
    renderCardList();
    const article = screen.getByRole("article");

    swipeRight(article);
    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    swipeRight(article);

    await waitFor(() => expect(mocks.editStudyProgress).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("Unable to save changes. Try again.")).not.toBeInTheDocument();
  });
});
