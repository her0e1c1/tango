import { cleanup, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";

import { DeckCard } from "@src/features/deck/components/DeckCard";
import { DeckListTemplate } from "@src/features/deck/components/templates/DeckListTemplate";

const deck = {
  id: "deck-id",
  name: "Deck name",
  category: "math",
  isPublic: false,
  url: "",
} as Deck;

describe("DeckCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the active study progress and enables restart", () => {
    const view = render(<DeckCard deck={deck} studyProgress={{ currentIndex: 1, cardCount: 3 }} />);

    expect(view.getByText("studying 2 card(s) from 3")).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Restart" })).toBeEnabled();
  });

  it("hides study progress and disables restart without an active session", () => {
    const view = render(<DeckCard deck={deck} />);

    expect(view.queryByText(/studying/)).not.toBeInTheDocument();
    expect(view.getByRole("button", { name: "Restart" })).toBeDisabled();
  });

  it("enables restart only for the deck that owns the active progress", () => {
    const otherDeck = { ...deck, id: "other-deck", name: "Other deck" };
    const view = render(
      <DeckListTemplate decks={[deck, otherDeck]} studyProgress={{ deckId: deck.id, currentIndex: 1, cardCount: 3 }} />
    );

    const restartButtons = view.getAllByRole("button", { name: "Restart" });
    expect(restartButtons[0]).toBeEnabled();
    expect(restartButtons[1]).toBeDisabled();
    expect(view.getAllByText(/studying/)).toHaveLength(1);
  });
});
