import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getI18n } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
vi.mock("@/entities/preference", () => ({
  usePreferences: () => data.preferences,
  getPreferences: () => data.preferences,
  setDarkMode: vi.fn(),
  toggleShowHelp: vi.fn(),
  toggleShowEditLink: vi.fn(),
  toggleShowCardDetails: vi.fn(),
  toggleShowPlaybackControls: vi.fn(),
  toggleShowSwipeButtonList: vi.fn(),
}));
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
        <Route path="/card/:id/edit" element={<h1>Editor</h1>} />
      </Routes>
    </MemoryRouter>
  );

describe("DECK-NAVIGATION-03 DECK-NAVIGATION-04 DECK-NAVIGATION-05 DECK-NAVIGATION-06 DECK-NAVIGATION-07 DECK-NAVIGATION-09 DECK-NAVIGATION-10 DECK-NAVIGATION-11 DeckViewPage", () => {
  afterEach(() => vi.useRealTimers());

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

  it.each([
    ["en", "Edit card"],
    ["ja", "カードを編集"],
  ])("opens the current card editor with a translated icon link in %s", async (language, label) => {
    await getI18n().changeLanguage(language);
    renderPage();
    expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", "/card/first/edit");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    const link = screen.getByRole("link", { name: label });
    expect(link).toHaveAttribute("href", "/card/second/edit");
    expect(link).toHaveTextContent("");
    link.focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Editor" })).toBeVisible();
  });

  it("flips either face, fixes keyboard navigation, and exits beyond either end", async () => {
    const view = renderPage();
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    expect(screen.getByRole("button", { name: "Card front" })).toHaveAccessibleDescription("First prompt");
    expect(screen.getByLabelText("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 2");
    await userEvent.click(screen.getByRole("button", { name: "Card front" }));
    expect(screen.getByRole("region", { name: "Card answer" })).toHaveTextContent("First answer");
    fireEvent.keyDown(window, { key: "ArrowUp" });
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(screen.getByRole("region", { name: "Card answer" })).toBeVisible();
    await userEvent.click(screen.getByText("First answer"));
    expect(screen.getByRole("button", { name: "Card front" })).toBeVisible();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    await userEvent.click(screen.getByRole("button", { name: "Card front" }));
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
    await userEvent.click(screen.getByRole("button", { name: "Card front" }));
    view.unmount();
    renderPage();
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    await userEvent.click(screen.getByRole("button", { name: "Back to deck list" }));
    expect(screen.getByRole("heading", { name: "Decks" })).toBeVisible();
  });

  it("uses pending filter selections with the same difficulty and tag rules", () => {
    data.pendingFilter = { difficultyMin: 3, difficultyMax: 5, selectedTags: ["target"], tagAndFilter: false };
    data.cards.push(
      createLocalCard({ id: "excluded", deckId: "deck-1", frontText: "Excluded", difficulty: 2, tags: ["target"] })
    );
    renderPage();
    expect(screen.getByLabelText("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 1");
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
  });

  it("excludes future review cards when the review schedule is enabled", () => {
    data.preferences = createPreferences({ useCardInterval: true });
    data.cards[0] = createLocalCard({ ...data.cards[0], nextSeeingAt: new Date(Date.now() + 86_400_000) });
    renderPage();
    expect(screen.getByLabelText("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 1");
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

  it("starts stopped even with default autoplay and advances without flipping until exiting after the last card", () => {
    vi.useFakeTimers();
    data.preferences = createPreferences({ defaultAutoPlay: true, cardInterval: 1 });
    renderPage();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("heading", { name: "Decks" })).toBeVisible();
  });

  it("pauses autoplay and background shortcuts during Help, then starts a fresh interval", () => {
    vi.useFakeTimers();
    data.preferences = createPreferences({ cardInterval: 1 });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(600));
    fireEvent.click(screen.getByRole("button", { name: "Open viewing help" }));
    expect(screen.getByRole("dialog", { name: "Viewing controls" })).toHaveTextContent("Go to the previous card");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "Enter" });
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    fireEvent.click(screen.getByRole("button", { name: "Close help" }));
    expect(screen.getByRole("button", { name: "Open viewing help" })).toHaveFocus();
    act(() => vi.advanceTimersByTime(999));
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
  });

  it("restarts the wait after manual movement and cancels departed playback on reentry", () => {
    vi.useFakeTimers();
    data.preferences = createPreferences({ cardInterval: 1 });
    const view = renderPage();
    fireEvent.keyDown(window, { key: " " });
    act(() => vi.advanceTimersByTime(600));
    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    act(() => vi.advanceTimersByTime(600));
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    view.unmount();
    renderPage();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
  });

  it("keeps interval-zero viewing manual and explains unavailable playback", () => {
    vi.useFakeTimers();
    data.preferences = createPreferences({ cardInterval: 0, defaultAutoPlay: true });
    renderPage();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: " " });
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    fireEvent.click(screen.getByRole("button", { name: "Open viewing help" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Autoplay is unavailable while the card interval is 0");
  });

  it("moves both ways with the slider, reserves its keys, and hides controls on the answer", () => {
    renderPage();
    const slider = screen.getByRole("slider", { name: "Viewing progress" });
    fireEvent.change(slider, { target: { value: "1" } });
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    fireEvent.change(slider, { target: { value: "0" } });
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByRole("region", { name: "Card answer" })).toBeVisible();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to deck list" })).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    expect(screen.getByRole("slider", { name: "Viewing progress" })).toHaveValue("1");
  });

  it("keeps linked answer content interactive without flipping the card", async () => {
    data.deck = createLocalDeck({ id: "deck-1", category: "math" });
    data.cards[0] = createLocalCard({ ...data.cards[0], backText: "[Read details](#answer-details)" });
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Card front" }));
    const link = screen.getByRole("link", { name: "Read details" });
    expect(link).toHaveAttribute("href", "#answer-details");
    await userEvent.click(link);
    expect(screen.getByRole("region", { name: "Card answer" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Card front" })).not.toBeInTheDocument();
  });
});
