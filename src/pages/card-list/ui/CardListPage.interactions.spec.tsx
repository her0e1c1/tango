import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createDeck, createPreferences } from "@/test/factories";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({
  deleteCard: vi.fn(),
  editDeck: vi.fn(),
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

const swipe = (article: HTMLElement, from: number, to: number) => {
  fireEvent.mouseDown(article, { clientX: from, clientY: 0 });
  fireEvent.mouseMove(document, { clientX: to, clientY: 0 });
  fireEvent.mouseUp(document, { clientX: to, clientY: 0 });
};

describe("CardListPage interactions", () => {
  beforeEach(() => {
    dismissToast();
    vi.clearAllMocks();
    mocks.deleteCard.mockResolvedValue(undefined);
    mocks.editDeck.mockResolvedValue(undefined);
    mocks.editStudyProgress.mockResolvedValue(undefined);
  });

  it("builds the list presentation and coordinates filter, view, and edit interactions", async () => {
    renderCardList();

    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
    expect(screen.getByText("score -2–4 · 2 tags")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove typescript filter" }));
    expect(screen.queryByRole("button", { name: "Remove typescript filter" })).not.toBeInTheDocument();
    expect(screen.getByText("score -2–4 · 1 tag")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "View Front" }));
    expect(screen.getByText("Back")).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close card" }));
    expect(screen.queryByText("Back")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Card editor destination" })).toBeVisible();
  });

  it("renders a language card answer in the overlay", async () => {
    const languageCard = createCard({
      ...card,
      backText: "const answer = 42;",
      tags: ["typescript"],
    });

    renderCardList({
      cards: [languageCard],
      preferences: createPreferences({ appearance: { darkMode: true } }),
    });

    await userEvent.click(screen.getByRole("button", { name: "View Front" }));

    expect(screen.getByLabelText("Close card")).toHaveTextContent(languageCard.backText);
  });

  it("owns deletion confirmation and success feedback", async () => {
    renderCardList();
    const trigger = screen.getByRole("button", { name: "Open actions for Front" });
    const status = screen.getByRole("status", { name: "Toast notifications" });

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("alertdialog", { name: "Delete card?" })).toHaveTextContent("Front");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete card" }));

    await waitFor(() => expect(mocks.deleteCard).toHaveBeenCalledExactlyOnceWith("user-id", card));
    expect(screen.getByRole("status", { name: "Toast notifications" })).toBe(status);
    expect(status).toHaveTextContent("Success: Deleted card “Front”.");
    expect(screen.getByText("Deleted card “Front”.")).toBeVisible();
  });

  it("keeps the deletion target available for retry after failure", async () => {
    mocks.deleteCard.mockRejectedValueOnce(new Error("delete failed"));
    renderCardList();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete card" }));

    const dialog = screen.getByRole("alertdialog", { name: "Delete card?" });
    expect(
      await within(dialog).findByText("Unable to delete this card. Check your connection and try again.")
    ).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to delete this card. Check your connection and try again."
    );
    expect(within(dialog).queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Delete card" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog", { name: "Delete card?" })).not.toBeInTheDocument());
  });

  it("locks cancellation while card deletion is pending", async () => {
    const request = Promise.withResolvers<void>();
    mocks.deleteCard.mockReturnValueOnce(request.promise);
    renderCardList();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete card" }));

    const dialog = screen.getByRole("alertdialog", { name: "Delete card?" });
    expect(dialog).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(dialog).toBeVisible();

    await actAsync(async () => {
      request.resolve();
      await request.promise;
    });
    await waitFor(() => expect(screen.queryByRole("alertdialog", { name: "Delete card?" })).not.toBeInTheDocument());
  });

  it("dismisses a deletion error when the dialog is cancelled", async () => {
    mocks.deleteCard.mockRejectedValueOnce(new Error("delete failed"));
    renderCardList();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete card" }));
    expect(await screen.findByText("Unable to delete this card. Check your connection and try again.")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog", { name: "Delete card?" })).not.toBeInTheDocument();
    expect(
      screen.queryByText("Unable to delete this card. Check your connection and try again.")
    ).not.toBeInTheDocument();
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

  it("does not let an older score failure replace deletion success", async () => {
    const scoreWrite = Promise.withResolvers<void>();
    mocks.editStudyProgress.mockReturnValueOnce(scoreWrite.promise);
    renderCardList();

    swipe(screen.getByRole("article"), 0, 100);
    await waitFor(() => expect(mocks.editStudyProgress).toHaveBeenCalledOnce());
    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete card" }));
    expect(await screen.findByText("Deleted card “Front”.")).toBeVisible();

    await actAsync(async () => {
      scoreWrite.reject(new Error("late score failure"));
      await scoreWrite.promise.catch(() => undefined);
    });

    expect(screen.getByText("Deleted card “Front”.")).toBeVisible();
    expect(screen.queryByText("Unable to save changes. Try again.")).not.toBeInTheDocument();
  });
});
