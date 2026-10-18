import { calculateFsrsState } from "@/entities/card";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getI18n } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { toggleViewMode, type Preferences } from "@/entities/preference";
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
  useCards: () => data.cards,
  useCardsByDeckId: () => ({ cards: data.cards, tags: [] }),
}));
vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  useDeck: () => data.deck,
}));
vi.mock("@/entities/preference", () => ({
  toggleViewMode: vi.fn(),
  toggleShowViewMode: vi.fn(),
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
  useDeckFilterSaveLifecycle: vi.fn(),
  useDeckFilterDraft: (_uid: string, deck: Deck) => ({
    state: { draft: data.pendingFilter ?? deck.cardFilter ?? { selectedTags: [], tagAndFilter: false } },
  }),
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

describe("NAVIGATION-08 NAVIGATION-09 NAVIGATION-10 NAVIGATION-11 NAVIGATION-12 NAVIGATION-14 NAVIGATION-15 NAVIGATION-16 DeckViewPage", () => {
  afterEach(() => vi.useRealTimers());

  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
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
    // Given: Use this case's inputs and any shared test setup.
    await getI18n().changeLanguage(language);
    renderPage();
    expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", "/card/first/edit");
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    const link = screen.getByRole("link", { name: label });
    // Then: Verify the expected result in the assertions below.
    expect(link).toHaveAttribute("href", "/card/second/edit");
    expect(link).toHaveTextContent("");
    // When: Exercise `link.focus` with the prepared inputs.
    link.focus();
    await userEvent.keyboard("{Enter}");
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { name: "Editor" })).toBeVisible();
  });

  it("flips either face, fixes keyboard navigation, and exits beyond either end", async () => {
    // Given: Prepare `view` and any shared test state below.
    const view = renderPage();
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    expect(screen.getByRole("button", { name: "Card front" })).toHaveAccessibleDescription("First prompt");
    expect(screen.getByLabelText("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 2");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Card front" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("region", { name: "Card answer" })).toHaveTextContent("First answer");
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "ArrowUp" });
    fireEvent.keyDown(window, { key: "ArrowDown" });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("region", { name: "Card answer" })).toBeVisible();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByText("First answer"));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toBeVisible();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Card front" }));
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Previous card" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { name: "Decks" })).toBeVisible();
    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Next card" }));
    await userEvent.click(screen.getByRole("button", { name: "Next card" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { name: "Decks" })).toBeVisible();
  });

  it("starts from the first front after remounting", async () => {
    // Given: Prepare `view` and any shared test state below.
    const view = renderPage();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Next card" }));
    await userEvent.click(screen.getByRole("button", { name: "Card front" }));
    view.unmount();
    renderPage();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Back to deck list" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { name: "Decks" })).toBeVisible();
  });

  it("uses pending filter selections with the same tag rules", () => {
    // Given: Use this case's inputs and any shared test setup.
    data.pendingFilter = { selectedTags: ["target"], tagAndFilter: false };
    data.cards.push(createLocalCard({ id: "excluded", deckId: "deck-1", frontText: "Excluded", tags: ["other"] }));
    // When: Exercise `renderPage` with the prepared inputs.
    renderPage();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByLabelText("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 1");
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
  });

  it("[CARD-FILTER-01] includes future review cards when the review schedule is enabled", () => {
    // Given: Use this case's inputs and any shared test setup.
    data.preferences = createPreferences({ useCardInterval: true });
    data.cards = data.cards.map((card, index) =>
      index === 0 ? { ...card, fsrs: { ...calculateFsrsState(null, "good", 0), dueAt: Date.now() + 86_400_000 } } : card
    );
    // When: Exercise `renderPage` with the prepared inputs.
    renderPage();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByLabelText("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 2");
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
  });

  it("shows recovery for empty and missing decks without active card controls", async () => {
    // Given: Prepare `view` and any shared test state below.
    data.cards = [];
    const view = renderPage();
    expect(screen.getByText("No cards yet")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Next card" })).not.toBeInTheDocument();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("No cards yet")).toBeVisible();
    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    data.deck = undefined;
    renderPage();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { name: "Deck not found" })).toBeVisible();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { name: "Decks" })).toBeVisible();
  });

  it("starts stopped even with default autoplay and advances without flipping until exiting after the last card", () => {
    // Given: Use this case's inputs and any shared test setup.
    vi.useFakeTimers();
    data.preferences = createPreferences({ defaultAutoPlay: true, cardInterval: 1 });
    renderPage();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(1000));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(1000));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { name: "Decks" })).toBeVisible();
  });

  it("pauses autoplay and background shortcuts during Help, then starts a fresh interval", () => {
    // Given: Use this case's inputs and any shared test setup.
    vi.useFakeTimers();
    data.preferences = createPreferences({ cardInterval: 1 });
    renderPage();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(600));
    fireEvent.click(screen.getByRole("button", { name: "Open viewing help" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("dialog", { name: "Viewing controls" })).toHaveTextContent("Go to the previous card");
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "Enter" });
    act(() => vi.advanceTimersByTime(2000));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Close help" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Open viewing help" })).toHaveFocus();
    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(999));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(1));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
  });

  it("restarts the wait after manual movement and cancels departed playback on reentry", () => {
    // Given: Prepare `view` and any shared test state below.
    vi.useFakeTimers();
    data.preferences = createPreferences({ cardInterval: 1 });
    const view = renderPage();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: " " });
    act(() => vi.advanceTimersByTime(600));
    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    act(() => vi.advanceTimersByTime(600));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    renderPage();
    act(() => vi.advanceTimersByTime(2000));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
  });

  it("keeps interval-zero viewing manual and explains unavailable playback", () => {
    // Given: Use this case's inputs and any shared test setup.
    vi.useFakeTimers();
    data.preferences = createPreferences({ cardInterval: 0, defaultAutoPlay: true });
    renderPage();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: " " });
    act(() => vi.advanceTimersByTime(2000));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Open viewing help" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("dialog")).toHaveTextContent("Autoplay is unavailable while the card interval is 0");
  });

  it("moves both ways with the slider, reserves its keys, and hides controls on the answer", () => {
    // Given: Prepare `slider` and any shared test state below.
    renderPage();
    const slider = screen.getByRole("slider", { name: "Viewing progress" });
    // When: Exercise `fireEvent.change` with the prepared inputs.
    fireEvent.change(slider, { target: { value: "1" } });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    // When: Exercise `fireEvent.change` with the prepared inputs.
    fireEvent.change(slider, { target: { value: "0" } });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "Enter" });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("region", { name: "Card answer" })).toBeVisible();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to deck list" })).not.toBeInTheDocument();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    expect(screen.getByRole("slider", { name: "Viewing progress" })).toHaveValue("1");
  });

  it("keeps linked answer content interactive without flipping the card", async () => {
    // Given: Use this case's inputs and any shared test setup.
    data.deck = createLocalDeck({ id: "deck-1", category: "math" });
    data.cards[0] = createLocalCard({ ...data.cards[0], backText: "[Read details](#answer-details)" });
    renderPage();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Card front" }));
    const link = screen.getByRole("link", { name: "Read details" });
    // Then: Verify the expected result in the assertions below.
    expect(link).toHaveAttribute("href", "#answer-details");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(link);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("region", { name: "Card answer" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Card front" })).not.toBeInTheDocument();
  });

  it("toggles view mode from the toolbar button", () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "View mode" }));
    // Then: Verify the expected result in the assertions below.
    expect(toggleViewMode).toHaveBeenCalledOnce();
  });
});
