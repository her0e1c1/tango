import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { clearStudySessions, useStudySession } from "@/entities/study-session";
import { createCard, createDeck, createPreferences, createStudyProgress } from "@/test/factories";

type StudyProgress = ReturnType<typeof createStudyProgress>;

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  deck: null as Deck | null,
  cards: [] as Card[],
  progresses: [] as StudyProgress[],
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/card", () => ({
  useCardsByDeckId: () => ({ cards: mocks.cards, tags: [] }),
}));
vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/entities/deck", () => ({
  editDeck: vi.fn(),
  selectStudyCards: (cards: Card[], progresses: StudyProgress[]) =>
    cards.map((card, index) => ({ card, progress: progresses[index] })),
  useDeck: () => mocks.deck ?? undefined,
}));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/entities/study-progress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/study-progress")>()),
  useStudyProgresses: () => mocks.progresses,
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

describe("StudySessionStartPage", () => {
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
    mocks.progresses = [createStudyProgress({ cardId })];
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

    fireEvent.keyDown(screen.getByRole("slider", { name: "Maximum score value" }), { key: "Enter" });
    expect(screen.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeVisible();

    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(screen.getByRole("heading", { level: 1, name: "Study session" })).toBeVisible();
    expect(screen.getByText(`Studying ${cardId}`)).toBeVisible();
  });

  it("creates a study session before navigating to it", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Start 1 card" }));

    expect(screen.getByRole("heading", { level: 1, name: "Study session" })).toBeVisible();
    expect(screen.getByText(`Studying ${cardId}`)).toBeVisible();
  });

  it("stays on the start page when no cards match", () => {
    mocks.cards = [];
    mocks.progresses = [];
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
