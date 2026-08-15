import type { Preferences } from "@/entities/preferences";
import type { ComponentProps } from "react";
import type { DeckList } from "@/features/deck-list";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { createCard, createDeck, createPreferences } from "@/test/factories";

type DeckListProps = ComponentProps<typeof DeckList>;

const mocks = vi.hoisted(() => ({
  preferences: {} as Preferences,
  decks: [] as Deck[],
  cards: [] as Card[],
  authUid: "user-1",
  hydrated: true,
  deleteDeck: vi.fn(async (_uid: string, _deck: Deck) => undefined),
  removeStudySession: vi.fn(),
  touchStudySession: vi.fn(),
  navigate: vi.fn(),
  sampleBootstrap: vi.fn(),
}));

vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: vi.fn(),
}));
vi.mock("@/entities/auth", () => ({
  useAuthUid: () => mocks.authUid,
}));
vi.mock("@/entities/card", () => ({
  generateCardId: vi.fn(),
  useCards: () => mocks.cards,
}));
vi.mock("@/entities/deck", () => ({
  createDeck: vi.fn(),
  deleteDeck: mocks.deleteDeck,
  useDecks: () => mocks.decks,
}));
vi.mock("@/features/deck-import", () => ({ useSampleDeckBootstrap: mocks.sampleBootstrap }));
vi.mock("@/features/study", () => ({
  removeStudySession: mocks.removeStudySession,
  touchStudySession: mocks.touchStudySession,
  useStudyHydrated: () => mocks.hydrated,
  useStudySessions: () => ({}),
}));
vi.mock("@/features/deck-list", () => ({
  DeckList: (props: DeckListProps) => {
    const deck = props.decks[0];
    if (deck == null) return null;
    return (
      <section aria-label="Deck list feature">
        <button type="button" onClick={() => props.onViewDeck(deck.id)}>
          View deck
        </button>
        <button type="button" onClick={() => props.onContinueDeck(deck.id)}>
          Continue deck
        </button>
        <button type="button" onClick={() => props.onStartDeck(deck.id)}>
          Start deck
        </button>
        <button type="button" onClick={() => props.onEditDeck(deck.id)}>
          Edit deck
        </button>
        <button type="button" onClick={() => void props.onDeleteDeck(deck)}>
          Delete deck
        </button>
      </section>
    );
  },
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { DeckListPage } from "./DeckListPage";

describe("DeckListPage", () => {
  const deck = createDeck({ id: "deck-1", name: "Deck" });
  const card = createCard({ id: "card-1", deckId: deck.id });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.preferences = createPreferences({ darkMode: false });
    mocks.decks = [deck];
    mocks.cards = [card];
    mocks.authUid = "user-1";
    mocks.hydrated = true;
  });

  it("composes route and reusable feature actions around the Deck List Feature", async () => {
    render(<DeckListPage />);

    fireEvent.click(screen.getByRole("button", { name: "View deck" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue deck" }));
    fireEvent.click(screen.getByRole("button", { name: "Start deck" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit deck" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete deck" }));

    expect(mocks.navigate).toHaveBeenNthCalledWith(1, `/deck/${deck.id}`);
    expect(mocks.touchStudySession).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, `/deck/${deck.id}/study`);
    expect(mocks.navigate).toHaveBeenNthCalledWith(3, `/deck/${deck.id}/start`);
    expect(mocks.navigate).toHaveBeenNthCalledWith(4, `/deck/${deck.id}/edit`);
    expect(mocks.deleteDeck).toHaveBeenCalledExactlyOnceWith(mocks.authUid, deck);
    await waitFor(() => expect(mocks.removeStudySession).toHaveBeenCalledExactlyOnceWith(deck.id));
  });

  it("keeps route shortcuts and sample bootstrap wiring", () => {
    render(<DeckListPage />);

    fireEvent.keyDown(window, { key: "s" });
    fireEvent.keyDown(window, { key: "i" });

    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/settings");
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, "/import");
    expect(mocks.sampleBootstrap).toHaveBeenCalledWith(expect.objectContaining({ decks: [deck], cards: [card] }));
  });

  it("renders empty list when no decks exist", () => {
    mocks.decks = [];
    render(<DeckListPage />);
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("waits for study hydration before composing the feature", () => {
    mocks.hydrated = false;
    const view = render(<DeckListPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading study progress");
    expect(screen.queryByRole("region", { name: "Deck list feature" })).not.toBeInTheDocument();

    mocks.hydrated = true;
    view.rerender(<DeckListPage />);
    expect(screen.getByRole("region", { name: "Deck list feature" })).toBeVisible();
  });
});
