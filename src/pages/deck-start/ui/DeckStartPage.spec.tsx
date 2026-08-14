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
  update: vi.fn(),
  navigate: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/card", () => ({
  filterCardsByDeckId: () => mocks.cards,
  filterTagsByDeckId: () => [],
  useCards: () => mocks.cards,
}));
vi.mock("@/entities/deck", () => ({
  useDeck: () => mocks.deck ?? undefined,
}));
vi.mock("@/features/card/read", () => ({
  useCardReadState: () => ({
    status: "ready" as const,
    retry: vi.fn(),
  }),
}));
vi.mock("@/features/deck-edit", () => ({ useDeckEditAction: () => ({ update: mocks.update }) }));
vi.mock("@/features/study/hooks/useStudyActions", () => ({
  useStudyActions: (_deckId: string, options: { onStarted?: () => void } = {}) => ({
    start: (_cards: Card[]) => {
      mocks.start();
      options.onStarted?.();
    },
  }),
}));
vi.mock("@/features/study/hooks/useStudyCards", () => ({ useStudyCards: () => mocks.cards }));
vi.mock("@/features/study/hooks/useDeckFilterState", () => ({
  useDeckFilterState: () => ({
    scoreMax: 4,
    scoreMin: -2,
    scoreMaxSwitchProps: { name: "maximum-enabled", checked: true, onChange: vi.fn() },
    scoreMinSwitchProps: { name: "minimum-enabled", checked: true, onChange: vi.fn() },
    scoreMaxSliderProps: { name: "maximum", value: "4", min: -10, max: 10, onChange: vi.fn() },
    scoreMinSliderProps: { name: "minimum", value: "-2", min: -10, max: 10, onChange: vi.fn() },
    tagFilterProps: { tags: [], selectedTags: [], tagAndFilter: false },
  }),
}));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => mocks.params,
}));

import { DeckStartPage } from "./DeckStartPage";

describe("DeckStartPage", () => {
  beforeEach(() => {
    mocks.params.id = "deck-id";
    mocks.preferences = createPreferences({ appearance: { darkMode: false }, study: { maxNumberOfCardsToLearn: 1 } });
    mocks.deck = createDeck({ id: "deck-id", name: "Japanese vocabulary" });
    mocks.cards = [createCard({ deckId: "deck-id" })];
    vi.clearAllMocks();
  });

  it("composes route data, the application shell, and the study view", () => {
    render(<DeckStartPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Start 1 card" })).toBeVisible();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("starts from Enter only outside interactive controls", () => {
    render(<DeckStartPage />);

    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(mocks.start).toHaveBeenCalledOnce();

    mocks.start.mockClear();
    fireEvent.keyDown(screen.getByRole("slider", { name: "Maximum score value" }), { key: "Enter" });
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("owns navigation after the study session starts", () => {
    render(<DeckStartPage />);

    fireEvent.click(screen.getByRole("button", { name: "Start 1 card" }));

    expect(mocks.start).toHaveBeenCalledOnce();
    expect(mocks.navigate).toHaveBeenCalledWith("/deck/deck-id/study", { replace: true });
  });

  it("does not start when no cards match", () => {
    mocks.cards = [];
    render(<DeckStartPage />);

    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(mocks.start).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
  });

  it("renders missing-deck recovery outside the application shell", () => {
    mocks.deck = null;
    render(<DeckStartPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
  });

  it("rejects a route without a deck id", () => {
    mocks.params.id = undefined;
    expect(() => render(<DeckStartPage />)).toThrowError("invalid deck id");
  });
});
