import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preference";
import type { DeckFilterValues } from "@/features/deck-filter";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

const data = vi.hoisted(() => ({
  cards: [] as Card[],
  deck: undefined as Deck | undefined,
  preferences: undefined as unknown as Preferences,
  pendingFilter: undefined as DeckFilterValues | undefined,
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({ useAuth: () => ({ uid: "viewer" }) }));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  useCardsByDeckId: () => ({ cards: data.cards, tags: [] }),
}));
vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  useDeck: () => data.deck,
}));
vi.mock("@/entities/preference", () => ({ usePreferences: () => data.preferences, setDarkMode: vi.fn() }));
vi.mock("@/features/deck-filter", () => ({
  useDeckFilterDraft: (_uid: string, deck: Deck) => ({ state: { draft: data.pendingFilter ?? deck } }),
}));

import { DeckViewPage } from "./DeckViewPage";

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/deck/deck-1/view"]}>
      <Routes>
        <Route path="/deck/:id/view" element={<DeckViewPage />} />
        <Route path="/" element={<h1>Decks</h1>} />
      </Routes>
    </MemoryRouter>
  );

describe("DECK-13 DECK-14 DECK-15 DECK-16 DECK-17 DeckViewPage", () => {
  beforeEach(() => {
    data.deck = createLocalDeck({ id: "deck-1", name: "View deck", category: "English" });
    data.cards = [
      createLocalCard({
        id: "first",
        deckId: "deck-1",
        frontText: "First prompt",
        backText: "First answer",
        tags: ["target"],
      }),
      createLocalCard({
        id: "second",
        deckId: "deck-1",
        frontText: "Second prompt",
        backText: "Second answer",
        tags: ["other"],
      }),
    ];
    data.preferences = createPreferences({
      shuffled: true,
      maxNumberOfCardsToLearn: 1,
      defaultAutoPlay: true,
      keepBackTextViewed: true,
    });
    data.pendingFilter = undefined;
  });

  it("flips either face, fixes keyboard navigation, and exits beyond either end", async () => {
    const view = renderPage();
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    expect(screen.getByLabelText("Viewing progress")).toHaveTextContent("1 / 2");
    await userEvent.click(screen.getByRole("button", { name: "Card front" }));
    expect(screen.getByRole("region", { name: "Card answer" })).toHaveTextContent("First answer");
    fireEvent.keyDown(window, { key: "ArrowUp" });
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(screen.getByRole("region", { name: "Card answer" })).toBeVisible();
    await userEvent.click(screen.getByRole("region", { name: "Card answer" }));
    expect(screen.getByRole("button", { name: "Card front" })).toBeVisible();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    await userEvent.click(screen.getByRole("button", { name: "Flip card" }));
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    await userEvent.click(screen.getByRole("button", { name: "Previous card" }));
    expect(screen.getByRole("heading", { name: "Decks" })).toBeVisible();
    view.unmount();
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Next card" }));
    await userEvent.click(screen.getByRole("button", { name: "Next card" }));
    expect(screen.getByRole("heading", { name: "Decks" })).toBeVisible();
  });

  it("starts from the first front after remounting", async () => {
    const view = renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Next card" }));
    await userEvent.click(screen.getByRole("button", { name: "Flip card" }));
    view.unmount();
    renderPage();
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    await userEvent.click(screen.getByRole("button", { name: "Back to decks" }));
    expect(screen.getByRole("heading", { name: "Decks" })).toBeVisible();
  });

  it("uses pending filter selections with the same difficulty and tag rules", () => {
    data.pendingFilter = { difficultyMin: 3, difficultyMax: 5, selectedTags: ["target"], tagAndFilter: false };
    data.cards.push(
      createLocalCard({ id: "excluded", deckId: "deck-1", frontText: "Excluded", difficulty: 2, tags: ["target"] })
    );
    renderPage();
    expect(screen.getByLabelText("Viewing progress")).toHaveTextContent("1 / 1");
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
  });

  it("excludes future review cards when the review schedule is enabled", () => {
    data.preferences = createPreferences({ useCardInterval: true });
    data.cards[0] = createLocalCard({ ...data.cards[0], nextSeeingAt: new Date(Date.now() + 86_400_000) });
    renderPage();
    expect(screen.getByLabelText("Viewing progress")).toHaveTextContent("1 / 1");
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
  });

  it("shows recovery for empty and missing decks without active card controls", async () => {
    data.cards = [];
    const view = renderPage();
    expect(screen.getByText("No cards match the current filters.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Next card" })).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("No cards match the current filters.")).toBeVisible();
    view.unmount();
    data.deck = undefined;
    renderPage();
    expect(screen.getByRole("heading", { name: "Deck not found" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    expect(screen.getByRole("heading", { name: "Decks" })).toBeVisible();
  });
});
