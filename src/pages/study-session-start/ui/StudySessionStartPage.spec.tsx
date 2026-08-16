import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createCard, createPreferences, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  preferences: null as unknown as Preferences,
  deck: null as Deck | null,
  cards: [] as Card[],
  start: vi.fn(),
  navigate: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/card", () => ({
  useCardsByDeckId: () => ({ cards: mocks.cards, tags: [] }),
}));
vi.mock("@/entities/deck", () => ({
  filterCardsForDeck: (cards: Card[]) => cards,
  useDeck: () => mocks.deck ?? undefined,
}));
vi.mock("@/entities/study-session", () => ({
  startStudy: () => mocks.start(),
}));
vi.mock("@/features/deck-filter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/deck-filter")>();
  return {
    ...actual,
    useDeckFilterState: () => ({
      scoreMax: 4,
      scoreMin: -2,
      selectedTags: [],
      tagAndFilter: false,
      setScoreMax: vi.fn(),
      setScoreMin: vi.fn(),
      setSelectedTags: vi.fn(),
      setTagAndFilter: vi.fn(),
    }),
  };
});
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => mocks.params,
}));

import { StudySessionStartPage } from "./StudySessionStartPage";

describe("StudySessionStartPage", () => {
  beforeEach(() => {
    mocks.params.id = "deck-id";
    mocks.preferences = createPreferences({ appearance: { darkMode: false }, study: { maxNumberOfCardsToLearn: 1 } });
    mocks.deck = createDeck({ id: "deck-id", name: "Japanese vocabulary" });
    mocks.cards = [createCard({ deckId: "deck-id" })];
    vi.clearAllMocks();
  });

  it("composes route data, the application shell, and the study view", () => {
    render(<StudySessionStartPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Start 1 card" })).toBeVisible();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("starts from Enter only outside interactive controls", () => {
    render(<StudySessionStartPage />);

    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(mocks.start).toHaveBeenCalledOnce();

    mocks.start.mockClear();
    fireEvent.keyDown(screen.getByRole("slider", { name: "Maximum score value" }), { key: "Enter" });
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("owns navigation after the study session starts", () => {
    mocks.start.mockImplementationOnce(() => expect(mocks.navigate).not.toHaveBeenCalled());
    render(<StudySessionStartPage />);

    fireEvent.click(screen.getByRole("button", { name: "Start 1 card" }));

    expect(mocks.start).toHaveBeenCalledOnce();
    expect(mocks.navigate).toHaveBeenCalledWith("/deck/deck-id/study", { replace: true });
  });

  it("does not start when no cards match", () => {
    mocks.cards = [];
    render(<StudySessionStartPage />);

    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(mocks.start).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
  });

  it("renders missing-deck recovery outside the application shell", () => {
    mocks.deck = null;
    render(<StudySessionStartPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
  });

  it("rejects a route without a deck id", () => {
    mocks.params.id = undefined;
    expect(() => render(<StudySessionStartPage />)).toThrowError("invalid deck id");
  });
});
