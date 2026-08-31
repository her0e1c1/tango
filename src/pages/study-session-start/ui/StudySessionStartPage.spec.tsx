import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { clearStudySessions, useStudySession } from "@/entities/study-session";
import { createCard, createDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  deck: null as Deck | null,
  cards: [] as Card[],
  tags: [] as string[],
  setDarkMode: vi.fn(),
  editDeck: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/entities/card", () => ({
  useCardsByDeckId: () => ({ cards: mocks.cards, tags: mocks.tags }),
}));
vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/entities/deck", () => ({
  editDeck: mocks.editDeck,
  isDeckTagSelectionMatching: () => true,
  useDeck: () => mocks.deck ?? undefined,
}));
vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { StudySessionStartPage } from "./StudySessionStartPage";

// Read the destination's public Entity state so navigation cannot hide a missing session mutation.
const StudySessionDestination = () => {
  const session = useStudySession("deck-id");
  return (
    <main>
      <h1>Study session</h1>
      <p>{session === undefined ? "No active session" : `Studying ${session.cardOrderIds.join(", ")}`}</p>
    </main>
  );
};

describe("StudySessionStartPage [SWIPE-06] [SWIPE-07]", () => {
  const deckId = "deck-id";
  const cardId = "card-id";
  const renderPage = (path = `/deck/${deckId}/start`) =>
    render(
      <MemoryRouter initialEntries={["/previous", path]} initialIndex={1}>
        <Routes>
          <Route path="/previous" element={<h1>Previous page</h1>} />
          <Route path="/" element={<h1>Deck list</h1>} />
          <Route path="/deck/:id/start" element={<StudySessionStartPage />} />
          <Route path="/deck/:id/study" element={<StudySessionDestination />} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(() => {
    clearStudySessions();
    mocks.preferences = createPreferences({ appearance: { darkMode: false }, study: { maxNumberOfCardsToLearn: 1 } });
    mocks.deck = createDeck({ id: deckId, name: "Japanese vocabulary" });
    mocks.cards = [createCard({ id: cardId, deckId })];
    mocks.tags = [];
    vi.clearAllMocks();
  });

  it("composes route data, the application shell, and the study view", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Start 1 card" })).toBeVisible();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("starts from Enter only outside interactive controls", () => {
    renderPage();

    fireEvent.keyDown(screen.getByRole("combobox", { name: "Maximum difficulty" }), { key: "Enter" });
    expect(screen.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeVisible();

    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(screen.getByRole("heading", { level: 1, name: "Study session" })).toBeVisible();
    expect(screen.getByText(`Studying ${cardId}`)).toBeVisible();
  });

  it("updates the session size immediately when a difficulty limit changes", async () => {
    mocks.preferences = createPreferences({ appearance: { darkMode: false }, study: { maxNumberOfCardsToLearn: 0 } });
    mocks.cards = [
      createCard({ id: "easy-card", deckId, difficulty: 2 }),
      createCard({ id: "hard-card", deckId, difficulty: 7 }),
    ];
    renderPage();

    expect(screen.getByRole("button", { name: "Start 2 cards" })).toBeVisible();
    const minimumDifficulty = screen.getByRole("combobox", { name: "Minimum difficulty" });

    fireEvent.keyDown(minimumDifficulty, { key: "Enter" });
    expect(screen.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeVisible();

    await userEvent.selectOptions(minimumDifficulty, "5");

    expect(screen.getByRole("button", { name: "Start 1 card" })).toBeVisible();
    expect(screen.getByText("1 card matches your filters.")).toBeVisible();
    expect(mocks.editDeck).toHaveBeenCalledWith("user-id", { id: deckId, difficultyMin: 5 });
  });

  it("reveals additional tags and persists a newly selected tag", async () => {
    mocks.tags = Array.from({ length: 12 }, (_, index) => `tag-${index + 1}`);
    renderPage();

    expect(screen.queryByRole("checkbox", { name: "tag-12" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show 4 more tags" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "tag-12" }));

    expect(mocks.editDeck).toHaveBeenCalledWith("user-id", { id: deckId, selectedTags: ["tag-12"] });
  });

  it("creates a study session before navigating to it", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Start 1 card" }));

    expect(screen.getByRole("heading", { level: 1, name: "Study session" })).toBeVisible();
    expect(screen.getByText(`Studying ${cardId}`)).toBeVisible();
  });

  it("stays on the start page when no cards match", () => {
    mocks.cards = [];
    renderPage();

    fireEvent.keyDown(document.body, { key: "Enter" });

    expect(screen.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
    expect(screen.queryByRole("heading", { level: 1, name: "Study session" })).not.toBeInTheDocument();
  });

  it("navigates with both recovery actions when the deck is unavailable", async () => {
    mocks.deck = null;
    const view = renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();

    view.unmount();
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
  });

  it("rejects a route without a deck id", () => {
    expect(() =>
      render(
        <MemoryRouter>
          <StudySessionStartPage />
        </MemoryRouter>
      )
    ).toThrowError("invalid deck id");
  });
});
