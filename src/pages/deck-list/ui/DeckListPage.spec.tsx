import type { Preferences } from "@/entities/preferences";
import type { ComponentProps } from "react";
import type { DeckList } from "@/features/deck-list";

import { fireEvent, render, screen } from "@testing-library/react";
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
  useAddSampleDeck: vi.fn(),
  requestDeletion: vi.fn(),
  touchStudySession: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: vi.fn(),
}));
vi.mock("@/entities/card", () => ({
  useCards: () => mocks.cards,
}));
vi.mock("@/entities/deck", () => ({
  useDecks: () => mocks.decks,
}));
vi.mock("@/features/deck-import", () => ({ useAddSampleDeck: mocks.useAddSampleDeck }));
vi.mock("@/entities/study-session", () => ({
  touchStudySession: mocks.touchStudySession,
  useStudySessions: () => ({}),
}));
vi.mock("@/features/deck-list", () => ({
  useDeckListState: ({ decks }: { decks: Deck[] }) => ({
    sections: { studying: [], other: decks.map((deck) => ({ deck, cardCount: 0 })) },
    deletionTarget: undefined,
    successMessage: undefined,
    onDownload: vi.fn(),
    onRequestDeletion: mocks.requestDeletion,
    onCancelDeletion: vi.fn(),
    onConfirmDeletion: vi.fn(),
  }),
  DeckList: (props: DeckListProps) => {
    const [item] = props.state.sections.other;
    const deck = item?.deck;
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
        <button type="button" onClick={() => props.state.onRequestDeletion(deck.id)}>
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
  });

  it("composes route and reusable feature actions around the Deck List Feature", () => {
    render(<DeckListPage />);

    fireEvent.click(screen.getByRole("button", { name: "View deck" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue deck" }));
    fireEvent.click(screen.getByRole("button", { name: "Start deck" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit deck" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete deck" }));

    expect(mocks.navigate).toHaveBeenNthCalledWith(1, `/deck/${deck.id}`, undefined);
    expect(mocks.touchStudySession).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, `/deck/${deck.id}/study`, undefined);
    expect(mocks.navigate).toHaveBeenNthCalledWith(3, `/deck/${deck.id}/start`, undefined);
    expect(mocks.navigate).toHaveBeenNthCalledWith(4, `/deck/${deck.id}/edit`, undefined);
    expect(mocks.requestDeletion).toHaveBeenCalledExactlyOnceWith(deck.id);
  });

  it("keeps route shortcuts and sample Deck wiring", () => {
    render(<DeckListPage />);

    fireEvent.keyDown(window, { key: "s" });
    fireEvent.keyDown(window, { key: "i" });

    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/settings", undefined);
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, "/import", undefined);
    expect(mocks.useAddSampleDeck).toHaveBeenCalledWith();
  });

  it("renders empty list when no decks exist", () => {
    mocks.decks = [];
    render(<DeckListPage />);
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });
});
